import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { base44 } from "@/api/base44Client";
import HeroSection from "../components/home/HeroSection";
import HighPriorityListings from "../components/home/HighPriorityListings";
import NeighborhoodExpertise from "../components/home/NeighborhoodExpertise";
import ServicesOverview from "../components/home/ServicesOverview";
import AgentHighlights from "../components/home/AgentHighlights";
import ClientStories from "../components/home/ClientStories";


export default function Home() {
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [p, a, t] = await Promise.all([
      base44.entities.Property.filter({ is_featured: true }, "-created_date", 6),
      base44.entities.Agent.filter({ is_featured: true }, "-created_date", 3),
      base44.entities.Testimonial.list("-created_date", 5)]
      );
      // Sort so Marina District Mediterranean Villa is first
      const sorted = p.sort((x, y) => {
        if (x.title === "Marina District Mediterranean Villa") return -1;
        if (y.title === "Marina District Mediterranean Villa") return 1;
        return 0;
      });
      setProperties(sorted);
      setAgents(a);
      setTestimonials(t);
      setLoading(false);
    };
    load();
  }, []);

  const parallaxRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: parallaxRef, offset: ["start end", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
      </div>);

  }

  return (
    <div>
      <HeroSection heroImage="https://media.base44.com/videos/public/6a0c3ea982f98940623f21f5/a0e02d2b4_Video_Back.mp4" />
      <HighPriorityListings properties={properties} />
      <div className="hairline max-w-[1400px] mx-auto" />
      <NeighborhoodExpertise />
      <ServicesOverview />
      <div className="hairline max-w-[1400px] mx-auto" />
      <AgentHighlights agents={agents} />
      <ClientStories testimonials={testimonials} />
      <section className="w-full h-[280px] md:h-[600px] overflow-hidden relative">
        <motion.div
          ref={parallaxRef}
          className="absolute inset-0 w-full h-[140%] top-[-20%]"
          style={{ y: parallaxY }}
        >
          <img
            src="https://media.base44.com/images/public/6a0c3ea982f98940623f21f5/6dda216cf_Base44_Templates_Gemini_3__Nano_Banana_Pro__2026-05-19_14-53-44.jpg"
            alt="Luxury brutalist modern home"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </section>
    </div>);

}