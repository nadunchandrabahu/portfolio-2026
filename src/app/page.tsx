import { ChatLauncher } from "@/components/chat/ChatLauncher";
import { Hero } from "@/components/hero/Hero";
import { ChainDrive } from "@/components/layout/ChainDrive";
import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import { PersonJsonLd } from "@/components/layout/PersonJsonLd";
import { RevealObserver } from "@/components/layout/RevealObserver";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Education } from "@/components/sections/Education";
import { Experience } from "@/components/sections/Experience";
import { HandsOn } from "@/components/sections/HandsOn";
import { Toolbox } from "@/components/sections/Toolbox";
import { Work } from "@/components/sections/Work";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[100] rounded-sm bg-brass px-4 py-3 font-mono text-small text-graphite focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Hero />
        <Work />
        <About />
        <HandsOn />
        <Toolbox />
        <Experience />
        <Education />
        <Contact />
      </main>
      <Footer />
      <ChatLauncher />
      <ChainDrive />
      <RevealObserver />
      <PersonJsonLd />
    </>
  );
}
