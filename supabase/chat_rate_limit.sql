-- Rate limiting for the public /api/chat endpoint.
-- Safe to re-run (idempotent).

CREATE TABLE IF NOT EXISTS chat_rate_limit (
  ip           TEXT PRIMARY KEY,
  count        INT NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No public access — only the service role (server-side) touches this table.
ALTER TABLE chat_rate_limit ENABLE ROW LEVEL SECURITY;

-- Atomic check-and-increment. Returns TRUE if the request is allowed.
-- SECURITY DEFINER so it runs with the owner's rights regardless of caller.
CREATE OR REPLACE FUNCTION check_chat_rate_limit(
  p_ip             TEXT,
  p_limit          INT,
  p_window_seconds INT
) RETURNS BOOLEAN AS $$
DECLARE
  v_count        INT;
  v_window_start TIMESTAMPTZ;
BEGIN
  SELECT count, window_start
    INTO v_count, v_window_start
    FROM chat_rate_limit
   WHERE ip = p_ip
     FOR UPDATE;

  -- First request from this IP
  IF NOT FOUND THEN
    INSERT INTO chat_rate_limit (ip, count, window_start)
    VALUES (p_ip, 1, now())
    ON CONFLICT (ip) DO UPDATE SET count = chat_rate_limit.count + 1;
    RETURN TRUE;
  END IF;

  -- Window expired — reset it
  IF v_window_start < now() - make_interval(secs => p_window_seconds) THEN
    UPDATE chat_rate_limit
       SET count = 1, window_start = now()
     WHERE ip = p_ip;
    RETURN TRUE;
  END IF;

  -- Over the limit
  IF v_count >= p_limit THEN
    RETURN FALSE;
  END IF;

  UPDATE chat_rate_limit SET count = count + 1 WHERE ip = p_ip;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Housekeeping: drop rows whose window is long expired.
CREATE OR REPLACE FUNCTION prune_chat_rate_limit() RETURNS void AS $$
  DELETE FROM chat_rate_limit WHERE window_start < now() - INTERVAL '1 day';
$$ LANGUAGE sql SECURITY DEFINER;
