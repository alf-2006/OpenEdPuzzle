import { Metadata } from "next";
import MsSignInCard from "@/components/ui/ms-sign-in-card";

export const metadata: Metadata = {
  title: "Sign in — WaslaLearn",
  description: "Sign in to your WaslaLearn account.",
};

export default function DemoOne() {
  return <MsSignInCard />;
}
