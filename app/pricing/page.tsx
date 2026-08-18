import { Metadata } from "next";
import Link from "next/link";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { Footer } from "@/app/(landing)/sections/footer";
import { Check, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "الخطط والأسعار — OpenEdPuzzle",
  description: "منصة OpenEdPuzzle مجانية ومفتوحة المصدر 100%.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" dir="rtl">
      <LandingNavbar />
      <main className="flex-1 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              100% مجاني ومفتوح المصدر
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
              خطط شفافة وبسيطة للجميع.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              مشروع OpenEdPuzzle متاح مجاناً للمعلمين والطلاب حول العالم برخصة MIT.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Community Free Plan */}
            <div className="p-8 rounded-3xl border-2 border-primary bg-card/80 shadow-xl space-y-6 relative flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  الخطة المفتوحة (الحالية)
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">$0</span>
                  <span className="text-muted-foreground text-sm">/ مجاناً للأبد</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  لكل المعلمين والمدارس والطلاب الراغبين في تجربة تعليمية تفاعلية موثوقة.
                </p>

                <ul className="space-y-3 pt-4 border-t border-border text-sm text-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>فيديوهات YouTube غير محدودة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>صفوف وطلاب غير محدودين</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>محرك مكافحة التخطي وتحقق الـ Heartbeat</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>خرائط الاستيعاب الحرارية والتقارير</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>استضافة ذاتية مفتوحة المصدر 100%</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-center block shadow-md hover:bg-primary/90 transition-all mt-6"
              >
                ابدأ مجاناً الآن
              </Link>
            </div>

            {/* Institution / Future Enterprise */}
            <div className="p-8 rounded-3xl border border-border bg-card/40 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold">
                  خطة المؤسسات (مستقبلاً)
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">Custom</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  للجامعات والمؤسسات الكبرى التي تحتاج إلى ربط مع أنظمة LMS مخصصة.
                </p>

                <ul className="space-y-3 pt-4 border-t border-border text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>تكامل LTI / Canvas / Blackboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>دخول موحد SSO للمؤسسة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>سيرفرات مخصصة ودعم فني مخصص</span>
                  </li>
                </ul>
              </div>

              <a
                href="https://github.com/alf-2006/OpenEdPuzzle"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-2xl border border-border text-foreground font-bold text-center block hover:bg-muted transition-all mt-6"
              >
                تواصل معنا على GitHub
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
