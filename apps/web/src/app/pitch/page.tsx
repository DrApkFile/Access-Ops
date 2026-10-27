import type { Metadata } from "next";
import localFont from "next/font/local";
import { PitchDeck } from "@/components/pitch/pitch-deck";

const manrope = localFont({src:'../../assets/fonts/Manrope-Variable.ttf',weight:'200 800',display:'swap'});

export const metadata: Metadata = {
  title: "bumps — hackathon pitch",
  description: "Three-slide opening deck for the bumps demo video.",
};

export default function PitchPage() {
  return <PitchDeck fontClassName={manrope.className} />;
}
