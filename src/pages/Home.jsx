import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import DownloadSection from '../components/Download';
import ComingSoon from '../components/ComingSoon';
import EnterpriseForm from '../components/EnterpriseForm';
import BugReportForm from '../components/BugReportForm';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <DownloadSection />
      <ComingSoon />
      <EnterpriseForm />
      <BugReportForm />
      <Footer />
    </>
  );
}
