export const site = {
  url: "https://sumitgautam.tech",
  name: "Sumit Gautam",
  title: "Sumit Gautam | Senior Full Stack Engineer",
  description:
    "Full stack engineer in Perth, Western Australia. Python, TypeScript, React, Rust, Kubernetes and distributed systems.",
  locality: "Perth",
  region: "WA",
  country: "AU",
  email: "sghost33@gmail.com",
  github: "https://github.com/SumitGA",
  linkedin: "https://www.linkedin.com/in/sumit-gautam-202b07a5/",
};

/* No trailing slashes. The site serves /projects, so a sitemap entry of
   /projects/ is a 308 redirect — a wasted crawl on every URL listed. */
export const routes = [
  { path: "/", title: "Sumit Gautam | Senior Full Stack Engineer", priority: 1.0 },
  { path: "/projects", title: "Projects", priority: 0.9 },
  { path: "/experience", title: "Experience", priority: 0.8 },
  { path: "/resume", title: "Resume", priority: 0.7 },
  { path: "/education", title: "Education", priority: 0.5 },
  { path: "/contact", title: "Contact", priority: 0.5 },
];
