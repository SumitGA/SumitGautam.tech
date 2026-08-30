-- ============================================================
-- Portfolio site database schema
-- Run this in your Supabase project SQL editor.
-- ============================================================

-- Settings (single row, id always = 1)
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  is_splash BOOLEAN NOT NULL DEFAULT true,
  use_custom_cursor BOOLEAN NOT NULL DEFAULT false,
  google_tracking_id TEXT NOT NULL DEFAULT ''
);

-- Greeting section
CREATE TABLE IF NOT EXISTS greeting (
  id INT PRIMARY KEY DEFAULT 1,
  title TEXT NOT NULL,
  title2 TEXT NOT NULL,
  logo_name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  full_name TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  resume_link TEXT NOT NULL DEFAULT '',
  mail TEXT NOT NULL DEFAULT ''
);

-- Social media links
CREATE TABLE IF NOT EXISTS social_media_links (
  id INT PRIMARY KEY DEFAULT 1,
  github TEXT NOT NULL DEFAULT '',
  linkedin TEXT NOT NULL DEFAULT '',
  gmail TEXT NOT NULL DEFAULT '',
  bitbucket TEXT NOT NULL DEFAULT '',
  facebook TEXT NOT NULL DEFAULT '',
  twitter TEXT NOT NULL DEFAULT '',
  instagram TEXT NOT NULL DEFAULT ''
);

-- Skills sections (rows = skill categories, sorted by sort_order)
CREATE TABLE IF NOT EXISTS skill_sections (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  skills JSONB NOT NULL DEFAULT '[]',          -- string[]
  software_skills JSONB NOT NULL DEFAULT '[]', -- {skillName, fontAwesomeClassname, style}[]
  sort_order INT NOT NULL DEFAULT 0
);

-- Education degrees
CREATE TABLE IF NOT EXISTS degrees (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  logo_path TEXT NOT NULL DEFAULT '',
  alt_name TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  descriptions JSONB NOT NULL DEFAULT '[]',    -- string[]
  website_link TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0
);

-- Certifications
CREATE TABLE IF NOT EXISTS certifications (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  logo_path TEXT NOT NULL DEFAULT '',
  certificate_link TEXT NOT NULL DEFAULT '',
  alt_name TEXT NOT NULL DEFAULT '',
  color_code TEXT NOT NULL DEFAULT '#000000',
  sort_order INT NOT NULL DEFAULT 0
);

-- Experience page header (single row)
CREATE TABLE IF NOT EXISTS experience_header (
  id INT PRIMARY KEY DEFAULT 1,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT NOT NULL,
  header_image_path TEXT NOT NULL DEFAULT 'experience.svg'
);

-- Experience sections (e.g. "Work Experience", "Volunteerships")
CREATE TABLE IF NOT EXISTS experience_sections (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- Individual experience entries
CREATE TABLE IF NOT EXISTS experiences (
  id SERIAL PRIMARY KEY,
  section_id INT NOT NULL REFERENCES experience_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_url TEXT NOT NULL DEFAULT '',
  logo_path TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#7c4962',
  sort_order INT NOT NULL DEFAULT 0
);

-- Projects page header (single row)
CREATE TABLE IF NOT EXISTS projects_header (
  id INT PRIMARY KEY DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  avatar_image_path TEXT NOT NULL DEFAULT 'projects_image.svg'
);

-- Individual projects
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  languages JSONB NOT NULL DEFAULT '[]',  -- {name, iconifyClass}[]
  sort_order INT NOT NULL DEFAULT 0
);

-- Contact page (single row)
CREATE TABLE IF NOT EXISTS contact (
  id INT PRIMARY KEY DEFAULT 1,
  title TEXT NOT NULL,
  profile_image_path TEXT NOT NULL DEFAULT 'profile_picture.jpeg',
  description TEXT NOT NULL DEFAULT '',
  blog_title TEXT NOT NULL DEFAULT '',
  blog_subtitle TEXT NOT NULL DEFAULT '',
  blog_link TEXT NOT NULL DEFAULT '',
  blog_avatar_image_path TEXT NOT NULL DEFAULT 'profile_picture.jpeg'
);

-- ============================================================
-- Enable Row Level Security (public read, service-role write)
-- ============================================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE greeting ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE degrees ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (portfolio is public)
CREATE POLICY "public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "public read greeting" ON greeting FOR SELECT USING (true);
CREATE POLICY "public read social_media_links" ON social_media_links FOR SELECT USING (true);
CREATE POLICY "public read skill_sections" ON skill_sections FOR SELECT USING (true);
CREATE POLICY "public read degrees" ON degrees FOR SELECT USING (true);
CREATE POLICY "public read certifications" ON certifications FOR SELECT USING (true);
CREATE POLICY "public read experience_header" ON experience_header FOR SELECT USING (true);
CREATE POLICY "public read experience_sections" ON experience_sections FOR SELECT USING (true);
CREATE POLICY "public read experiences" ON experiences FOR SELECT USING (true);
CREATE POLICY "public read projects_header" ON projects_header FOR SELECT USING (true);
CREATE POLICY "public read projects" ON projects FOR SELECT USING (true);
CREATE POLICY "public read contact" ON contact FOR SELECT USING (true);

-- Only authenticated users (admin) can write
CREATE POLICY "auth write settings" ON settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write greeting" ON greeting FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write social_media_links" ON social_media_links FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write skill_sections" ON skill_sections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write degrees" ON degrees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write certifications" ON certifications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write experience_header" ON experience_header FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write experience_sections" ON experience_sections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write experiences" ON experiences FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write projects_header" ON projects_header FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write projects" ON projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth write contact" ON contact FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- Seed data (from portfolio.js)
-- ============================================================

INSERT INTO settings (id, is_splash, use_custom_cursor, google_tracking_id)
VALUES (1, true, false, 'UA-132872250-1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO greeting (id, title, title2, logo_name, nickname, full_name, subtitle, resume_link, mail)
VALUES (
  1,
  'Hello 👋.',
  'Sumit Gautam',
  'SumitGA()',
  'SumitGA / SG',
  'Sumit Gautam',
  'Full Stack Developer, Open Source and AI Enthusiast 🔥. Always learning.',
  'https://drive.google.com/file/d/1EOzPazNAGmz2kGlmVDJ4MEKNHbKVgWHA/view?usp=sharing',
  'sghost33@gmail.com'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO social_media_links (id, github, linkedin, gmail, bitbucket, facebook, twitter, instagram)
VALUES (
  1,
  'https://github.com/SumitGA',
  'https://www.linkedin.com/in/sumit-gautam-202b07a5/',
  'sghost33@gmail.com',
  'https://bitbucket.org/SumitGA/',
  'https://www.facebook.com/shuvaraya/',
  'https://twitter.com/SumitGautam_SE',
  'https://www.instagram.com/sumitgak/'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO skill_sections (title, file_name, skills, software_skills, sort_order)
VALUES
(
  'Full Stack Development',
  'FullStackImg',
  '["⚡ Develop highly interactive Front end / User Interfaces for web and mobile applications","⚡ Building responsive website front end using ReactJS/Redux, NextJs and other JS library and framework","⚡ Developing mobile applications using XCode/Swift/SwiftUI and Android Studio","⚡ Creating application backend in Node, Express, Ruby on Rails, and Java Spring Boot","⚡ Integration of third party services such as Firebase/ AWS / Digital Ocean","⚡ Deploying application to production using docker, kubernetes, and jenkins"]',
  '[{"skillName":"HTML5","fontAwesomeClassname":"simple-icons:html5","style":{"color":"#E34F26"}},{"skillName":"CSS3","fontAwesomeClassname":"fa-css3","style":{"color":"#1572B6"}},{"skillName":"JavaScript","fontAwesomeClassname":"simple-icons:javascript","style":{"backgroundColor":"#FFFFFF","color":"#F7DF1E"}},{"skillName":"Ruby","fontAwesomeClassname":"simple-icons:ruby","style":{"color":"#CC342D"}},{"skillName":"Ruby on Rails","fontAwesomeClassname":"simple-icons:rubyonrails","style":{"color":"#CC0000"}},{"skillName":"ReactJS","fontAwesomeClassname":"simple-icons:react","style":{"color":"#61DAFB"}},{"skillName":"NodeJS","fontAwesomeClassname":"simple-icons:node-dot-js","style":{"color":"#339933"}},{"skillName":"NPM","fontAwesomeClassname":"simple-icons:npm","style":{"color":"#CB3837"}},{"skillName":"MongoDB","fontAwesomeClassname":"simple-icons:mongodb","style":{"color":"#439743"}},{"skillName":"Python","fontAwesomeClassname":"simple-icons:python","style":{"color":"#F05138"}},{"skillName":"Rust","fontAwesomeClassname":"simple-icons:rust","style":{"color":"#3DDC84"}},{"skillName":"Java","fontAwesomeClassname":"simple-icons:java","style":{"color":"#f89820"}},{"skillName":"Hugo","fontAwesomeClassname":"simple-icons:hugo","style":{"color":"#FF4088"}},{"skillName":"MySQL","fontAwesomeClassname":"simple-icons:mysql","style":{"color":"#4479A1"}},{"skillName":"jQuery","fontAwesomeClassname":"simple-icons:jquery","style":{"color":"#0865A6"}},{"skillName":"Wordpress","fontAwesomeClassname":"simple-icons:wordpress","style":{"color":"#207297"}},{"skillName":"Apache","fontAwesomeClassname":"simple-icons:apache","style":{"color":"#CA1A22"}},{"skillName":"Git","fontAwesomeClassname":"simple-icons:git","style":{"color":"#E94E32"}},{"skillName":"C","fontAwesomeClassname":"simple-icons:c","style":{"color":"#E94E32"}},{"skillName":"C++","fontAwesomeClassname":"simple-icons:cplusplus","style":{"color":"#E94E32"}},{"skillName":"Python (ML)","fontAwesomeClassname":"simple-icons:python","style":{"color":"#3776AB"}}]',
  0
),
(
  'Cloud Infra-Architecture',
  'CloudInfraImg',
  '["⚡ Experience working on multiple cloud platforms","⚡ Experience hosting and managing websites","⚡ Experience with Continuous Integration"]',
  '[{"skillName":"AWS","fontAwesomeClassname":"simple-icons:amazonaws","style":{"color":"#FF9900"}},{"skillName":"Google Cloud","fontAwesomeClassname":"simple-icons:googlecloud","style":{"color":"#4285F4"}},{"skillName":"Netlify","fontAwesomeClassname":"simple-icons:netlify","style":{"color":"#38AFBB"}},{"skillName":"Heroku","fontAwesomeClassname":"simple-icons:heroku","style":{"color":"#6863A6"}},{"skillName":"Firebase","fontAwesomeClassname":"simple-icons:firebase","style":{"color":"#FFCA28"}},{"skillName":"PostgreSQL","fontAwesomeClassname":"simple-icons:postgresql","style":{"color":"#336791"}},{"skillName":"MongoDB","fontAwesomeClassname":"simple-icons:mongodb","style":{"color":"#47A248"}},{"skillName":"Docker","fontAwesomeClassname":"simple-icons:docker","style":{"color":"#1488C6"}},{"skillName":"Kubernetes","fontAwesomeClassname":"simple-icons:kubernetes","style":{"color":"#326CE5"}},{"skillName":"GitHub Actions","fontAwesomeClassname":"simple-icons:githubactions","style":{"color":"#5b77ef"}}]',
  1
);

INSERT INTO degrees (title, subtitle, logo_path, alt_name, duration, descriptions, website_link, sort_order)
VALUES
(
  'Federation University',
  'Masters of Technology Information Technology',
  'federation.png',
  'MIT',
  '2020 - 2021',
  '["⚡ I have completed my masters of technology in Information Technology","⚡ I have studied core subjects like Data Structures, DBMS, Networking, Security, etc.","⚡ I have also completed various online courses for Backend , Web , Mobile App Development, etc."]',
  'https://federation.edu.au/',
  0
),
(
  'Tribhuvan University',
  'Bachelor in Computer Science and Information Technology',
  'tu.png',
  'BSc. CSIT',
  '2013 - 2017',
  '["⚡ I''m currently pursuing my bachelors in Information Technology.","⚡ I have studied core subjects like Data Structures, DBMS, Networking, Security, etc.","⚡ I have also completed various online courses for Backend , Web , Mobile App Development, etc.","⚡ I have implemented several projects based on what I''ve learnt under my Computer Science and IT courses."]',
  'https://tribhuvan-university.edu.np/',
  1
),
(
  'Triton International College',
  'High School',
  'triton.png',
  'Plus2',
  '2011 - 2013',
  '["⚡ I have studied core subjects like Physics, Chemistry, Maths, Computer Science, etc."]',
  'https://www.triton.edu.np/',
  2
);

INSERT INTO certifications (title, subtitle, logo_path, certificate_link, alt_name, color_code, sort_order)
VALUES
(
  'Microservices with NodeJs and React',
  'Microservices with NodeJs and React with Udemy',
  'https://udemy-certificate.s3.amazonaws.com/image/UC-12f60cc2-269f-4e96-84e0-59cf0dbd87be.jpg',
  'https://www.udemy.com/certificate/UC-12f60cc2-269f-4e96-84e0-59cf0dbd87be/',
  'NodeJS and React',
  '#E2405F',
  0
),
(
  'UI/UX Responsive Design with HTML, CSS, Bootstrap5',
  'UI/UX with Udemy',
  'https://udemy-certificate.s3.amazonaws.com/image/UC-229fc7b7-de85-4d32-8d06-3399758b629a.jpg',
  'https://www.udemy.com/certificate/UC-229fc7b7-de85-4d32-8d06-3399758b629a/',
  'Udemy',
  '#47A048',
  1
),
(
  'Implement High Fidelity Design with Material-UI and ReactJS',
  'Material-UI with ReactJS - Udemy',
  'https://udemy-certificate.s3.amazonaws.com/image/UC-535c7e04-9247-4c9c-94bc-0de0ba611f87.jpg',
  'https://drive.google.com/file/d/12uAdjQC5LfrB1ODdxqIY181ugyyQhl-I/view?usp=sharing',
  'Udemy',
  '#2AAFED',
  2
),
(
  'Proxmox VE6',
  'Networking with Proxmox VE6',
  'https://udemy-certificate.s3.amazonaws.com/image/UC-b3cd3812-a1c3-41fe-8f8e-7dbd8593da24.jpg',
  'https://www.udemy.com/certificate/UC-b3cd3812-a1c3-41fe-8f8e-7dbd8593da24/',
  'Proxmox VE6 - Udemy',
  '#00FFFF',
  3
),
(
  'NTF Web Development',
  'Zero to Hero with NFT Web',
  'https://udemy-certificate.s3.amazonaws.com/image/UC-74a4e6e5-5815-43ae-b802-7789a8e26d11.jpg',
  'https://www.udemy.com/certificate/UC-74a4e6e5-5815-43ae-b802-7789a8e26d11/',
  'NFT Web Development - Udemy',
  '#F6B808',
  4
),
(
  'Advance React Redux',
  'Advance React Redux with Stephen Grider',
  'https://udemy-certificate.s3.amazonaws.com/image/UC-1b26f414-d81b-40d1-8682-f8ecad1d7fc5.jpg',
  'https://www.udemy.com/certificate/UC-1b26f414-d81b-40d1-8682-f8ecad1d7fc5/',
  'Advance React Redux - Udemy',
  '#85219C',
  5
);

INSERT INTO experience_header (id, title, subtitle, description, header_image_path)
VALUES (
  1,
  'Experience',
  'Work, Internship and Volunteership',
  'I''ve 3+ years of experience working as a full stack developer. I''ve mostly done more than 15+ projects till date and I am actively looking for new and exciting opportunities. I love organizing workshops to share my knowledge with others.',
  'experience.svg'
) ON CONFLICT (id) DO NOTHING;

WITH sec AS (
  INSERT INTO experience_sections (title, sort_order) VALUES
    ('Work Experience', 0),
    ('Volunteerships', 1)
  RETURNING id, title
)
INSERT INTO experiences (section_id, title, company, company_url, logo_path, duration, location, description, color, sort_order)
SELECT sec.id, exp.title, exp.company, exp.company_url, exp.logo_path, exp.duration, exp.location, exp.description, exp.color, exp.sort_order
FROM sec
JOIN (
  VALUES
    ('Work Experience', 'Software Engineer', 'Intersect Australia', 'https://intersect.org.au/', 'intersect-logo.svg', 'May 2023 - Nov 2025', 'WeWork, Level 2, 320 Pitt St, Sydney NSW 2000', 'Architected and scaled high-performance engineering platforms by integrating Agentic GenAI automation, migrating legacy systems to optimized Rust microservices, and leading cloud-native deployments while mentoring cross-functional teams.', '#7c4962', 0),
    ('Work Experience', 'Full Stack Developer', 'EZY RAISE', 'https://www.ezyraise.com/', 'ezyraise-logo.jpeg', 'Aug 2022 - Nov 2022', '50 Miller St, North Sydney NSW 2060', 'Work closely with the Project Manager and Team Leads on change request functions. Increased productivity and problem-solving technics by 20%. We primarily used Ruby on Rails, Haml and React.', '#7c4962', 1),
    ('Work Experience', 'Software Engineer', 'Whitehat Engineering', 'https://whitehatengineering.com/', 'whitehatengineering.jpeg', 'Jan 2020 - Jan 2022', 'Redmond Washington DC, USA', 'Train, manage and provide guidance to junior software development staff. Develops new and maintains existing applications. Increased productivity and problem-solving technics by 20%. Primarily used PERN and MERN Stack.', '#7c4962', 2),
    ('Work Experience', 'Full Stack Developer', 'Enliv Technology', 'https://enlivit.com/', 'enliv.png', 'Nov 2017 - Feb 2020', 'Sinamangal, Kathmandu, Nepal', 'Work closely with the Client and Team on change request functions. Primarily used LAMP Stack. 40% backend, 30% database design, 30% hosting/traffic.', '#7c4962', 3),
    ('Work Experience', 'Full Stack Developer', 'Codyssey Web Nepal', 'https://codysseynepal.com/', 'codyssey.png', 'Jan 2017 - Aug 2017', 'Kathmandu Nepal', 'Work closely with the Client and Team on change request functions. Primarily used LAMP Stack. 40% backend, 30% database design, 30% hosting/traffic.', '#7c4962', 4),
    ('Volunteerships', 'GitHub Student Developer', 'GitHub', 'https://github.com/', 'github.png', 'Nov 2019 - Present', 'Work from Home', 'Contribute to Open Source Community and Open Source Project.', '#040f26', 0)
) AS exp(section_title, title, company, company_url, logo_path, duration, location, description, color, sort_order)
  ON sec.title = exp.section_title;

INSERT INTO projects_header (id, title, description, avatar_image_path)
VALUES (
  1,
  'Projects',
  'My projects make use of a vast variety of latest technology tools. My best experience is to create Ruby on Rails Backend Projects, NodeJS Backend Projects, Scripts, and React Project. Below are some of my projects.',
  'projects_image.svg'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (name, url, description, languages, sort_order)
VALUES
(
  'NFTMarketPlace',
  'https://github.com/SumitGA/NFTMarketPlace',
  'This is NFT Market Place. This provides platform to buy sell NFT tokens with the help of Bitcoin Wallet.',
  '[{"name":"Solidity","iconifyClass":"logos-solidity"},{"name":"NodeJS","iconifyClass":"logos-nodejs"},{"name":"React","iconifyClass":"logos-react"},{"name":"Javascript","iconifyClass":"logos-javascript"}]',
  0
),
(
  'VideoChat',
  'https://github.com/SumitGA/VideoChat',
  'A video chat application based on WEBRTL. This app allows you to make a video call, audio call and text messages between clients.',
  '[{"name":"HTML5","iconifyClass":"vscode-icons:file-type-html"},{"name":"CSS3","iconifyClass":"vscode-icons:file-type-css"},{"name":"Javascript","iconifyClass":"logos-javascript"},{"name":"Firebase","iconifyClass":"logos-firebase"}]',
  1
),
(
  'Espider',
  'https://github.com/SumitGA/espider',
  'This is a web scaper application which crawls e-kantipur website''s news page to collect data and expose them as an API',
  '[{"name":"Ruby","iconifyClass":"logos-ruby"},{"name":"Ruby on Rails","iconifyClass":"logos-rails"},{"name":"ERB","iconifyClass":"vscode-icons:file-type-erb"}]',
  2
),
(
  'ChatAPI',
  'https://github.com/SumitGA/chatApi',
  'A chat api with nodejs, mongodb, typescript and react as a tech stack. It allow user to communicate each other using a web application.',
  '[{"name":"HTML5","iconifyClass":"vscode-icons:file-type-html"},{"name":"CSS3","iconifyClass":"vscode-icons:file-type-css"},{"name":"ReactJs","iconifyClass":"logos-react"},{"name":"Typescript","iconifyClass":"vscode-icons:file-type-typescript"},{"name":"NodeJS","iconifyClass":"logos-nodejs"}]',
  3
),
(
  'Ticketing Service',
  'https://github.com/SumitGA/Ticketing-Service',
  'This project is a production level implementation of microservices using NAT Streaming Server, Kubernetes, Stripejs Payment services.',
  '[{"name":"JavaScript","iconifyClass":"logos-javascript"},{"name":"NodeJS","iconifyClass":"vscode-icons:file-type-node"},{"name":"Typescript","iconifyClass":"vscode-icons:file-type-typescript"},{"name":"Kubernetes","iconifyClass":"logos-kubernetes"},{"name":"MongoDB","iconifyClass":"logos-mongodb"}]',
  4
),
(
  'IDE Typescript',
  'https://github.com/SumitGA/IDE-Typescript',
  'This is a simple IDE created with react and typescript',
  '[{"name":"NodeJS","iconifyClass":"vscode-icons:file-type-node"},{"name":"Typescript","iconifyClass":"vscode-icons:file-type-typescript"},{"name":"React","iconifyClass":"logos-react"}]',
  5
),
(
  'Personal Portfolio',
  'https://sumitgautam.tech',
  'A Personal Portfolio Website that showcases my work and experience. Hosted on GitHub Pages.',
  '[{"name":"HTML5","iconifyClass":"vscode-icons:file-type-html"},{"name":"CSS3","iconifyClass":"vscode-icons:file-type-css"},{"name":"JavaScript","iconifyClass":"logos-javascript"},{"name":"SCSS","iconifyClass":"vscode-icons:file-type-scss2"}]',
  6
);

INSERT INTO contact (id, title, profile_image_path, description, blog_title, blog_subtitle, blog_link, blog_avatar_image_path)
VALUES (
  1,
  'Contact Me',
  'profile_picture.jpeg',
  'You can contact me at the places mentioned below. I will try to get back to you as fast as I can.',
  'Blogs',
  'I don''t blog frequently but when I do something awesome, I do try to document it so it can be helpful to others. I write on Twitter.',
  'https://twitter.com/SumitGautam_SE',
  'profile_picture.jpeg'
) ON CONFLICT (id) DO NOTHING;
