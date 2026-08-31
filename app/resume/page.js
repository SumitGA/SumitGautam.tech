import { getResumeData } from "../../lib/portfolio-data";
import ResumeView from "./ResumeView";

export const metadata = {
  title: "Resume",
  description: "Sumit Gautam – CV and professional experience",
};

export default async function ResumePage() {
  const resumeData = await getResumeData();
  return <ResumeView data={resumeData} />;
}
