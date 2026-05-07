import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import DownloadSection from '../components/Download';
import ComingSoon from '../components/ComingSoon';
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
      <BugReportForm />
      <Footer />
    </>
  );
}
