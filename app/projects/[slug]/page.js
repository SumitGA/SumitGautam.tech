import { notFound } from "next/navigation";
import { getProjectBySlug, getCaseStudySlugs } from "../../../lib/portfolio-data";
import CaseStudyView from "./CaseStudyView";

export async function generateStaticParams() {
  const slugs = await getCaseStudySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };

  return {
    title: `${project.name} — Case Study`,
    description: project.tagline || project.description,
    alternates: { canonical: `/projects/${slug}` },
  };
}

export default async function ProjectCaseStudyPage({ params }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  return <CaseStudyView project={project} />;
}
