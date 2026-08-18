import { Metadata } from "next";
import Link from "next/link";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { Footer } from "@/app/(landing)/sections/footer";
import { ShieldCheck, Video, BrainCircuit, Heart, ArrowLeft, Github } from "lucide-react";
import { PillMorphButton } from "@/components/ui/pill-morph-button";

export const metadata: Metadata = {
  title: "عن المنصة — OpenEdPuzzle",
  description: "تعرف على منصة OpenEdPuzzle التعليمية المفتوحة المصدر للتعلم بالفيديو التفاعلي مع التحقق الحقيقي.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" dir="rtl">
      <LandingNavbar />
      <main className="flex-1 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold">
              // رؤيتنا ورسالتنا
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
              التعلم التفاعلي الحقيقي بدون تخمين.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              OpenEdPuzzle هي منصة تعليمية مفتوحة المصدر تمنح المعلمين أدوات دقيقة للتأكد من فهم الطلاب لكل ثانية في الدروس المصورة.
            </p>
          </div>

          {/* Core Values */}
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">تحقق رياضي لا يعتمد على الثقة</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                نقوم بمطابقة الفترات الزمنية للمشاهدة مع الوقت الفعلي على الخادم لمنع تسريع الفيديو غير القانوني والتخطي.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">محطات استيعاب إجبارية</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                إدراج أسئلة تفاعلية تقفل المشغل وتضمن ألا يمر الطالب قبل فهم المحتوى وتأكيد الإجابة.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">مفتوح المصدر بالكامل</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                حرية تامة، بدون اشتراكات مغلقة، قابل للاستضافة الذاتية برخصة MIT ومبني بأحدث التقنيات.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="p-8 rounded-3xl bg-primary text-primary-foreground text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black">جاهز للبدء في تحويل فيديوهاتك التعليمية؟</h2>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/signup"
                className="px-6 py-3 rounded-full bg-white text-primary font-bold text-sm hover:bg-white/90 transition-all shadow-md"
              >
                إنشاء حساب مجاني الآن
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
