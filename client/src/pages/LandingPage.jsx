import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Ticker from '../components/landing/Ticker';
import Compare from '../components/landing/Compare';
import Benchmarks from '../components/landing/Benchmarks';
import Speed from '../components/landing/Speed';
import Reach from '../components/landing/Reach';
import Stack from '../components/landing/Stack';
import Pricing from '../components/landing/Pricing';
import FAQ from '../components/landing/FAQ';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/landing/Footer';
import '../styles/tokens.css';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Ticker />
        <Compare />
        <Benchmarks />
        <Speed />
        <Reach />
        <Stack />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
