"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function MsSignInCard() {
  const [step, setStep] = useState<"login" | "register" | "forgot_password">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleNext = () => {
    if (step === "login") {
      console.log("Login email entered:", email)
      // Add authentication logic here
    } else if (step === "register") {
      console.log("Register with:", email, password)
    } else if (step === "forgot_password") {
      console.log("Recover account for:", email)
    }
  }

  return (
    <div
      dir="ltr"
      className="grid place-items-center h-full w-full bg-[#fafafa] dark:bg-gray-900"
    >
      <div className="w-full max-w-[440px] rounded-md bg-white shadow-[0_2px_6px_rgba(0,0,0,0.2)] py-11 px-11 dark:bg-gray-800">
        {/* Logo — same as landing-navbar */}
        <Link
          href="/"
          className="inline-flex items-center text-xl font-bold tracking-tight hover:opacity-90 transition-opacity select-none group mb-2"
        >
          <span className="text-primary font-black tracking-tighter group-hover:scale-105 transition-transform">Open</span>
          <span className="text-foreground font-bold">EdPuzzle</span>
        </Link>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-3">
          {step === "login" && "Sign in"}
          {step === "register" && "Create account"}
          {step === "forgot_password" && "Recover your account"}
        </h1>

        {/* Content depending on step */}
        {step === "login" && (
          <>
            <input
              type="text"
              placeholder="E-mail, phone, or Skype"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
              className="mt-6 w-full h-[36px] px-3 rounded border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] transition-colors dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500 dark:placeholder:text-gray-400 dark:focus:border-blue-400"
            />
            <div className="mt-4 text-[13px]">
              <p className="text-gray-700 dark:text-gray-400">
                No account?{" "}
                <button
                  type="button"
                  onClick={() => setStep("register")}
                  className="text-[#0067b8] hover:underline dark:text-blue-400"
                >
                  Create one!
                </button>
              </p>
              <p className="mt-1">
                <button
                  type="button"
                  onClick={() => setStep("forgot_password")}
                  className="text-[13px] text-[#0067b8] hover:underline dark:text-blue-400"
                >
                  Can&apos;t access your account?
                </button>
              </p>
            </div>
          </>
        )}

        {step === "register" && (
          <>
            <input
              type="text"
              placeholder="Someone@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-6 w-full h-[36px] px-3 rounded border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] transition-colors dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500 dark:placeholder:text-gray-400 dark:focus:border-blue-400"
            />
            <input
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
              className="mt-4 w-full h-[36px] px-3 rounded border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] transition-colors dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500 dark:placeholder:text-gray-400 dark:focus:border-blue-400"
            />
          </>
        )}

        {step === "forgot_password" && (
          <>
            <p className="mt-2 text-[13px] text-gray-700 dark:text-gray-400">
              Enter your email, phone, or Skype name to get back into your account.
            </p>
            <input
              type="text"
              placeholder="E-mail, phone, or Skype"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
              className="mt-4 w-full h-[36px] px-3 rounded border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] transition-colors dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500 dark:placeholder:text-gray-400 dark:focus:border-blue-400"
            />
          </>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-[6px] mt-6">
          {step !== "login" && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setStep("login")}
              className="flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full min-w-[108px] h-[40px] px-4 font-semibold text-sm transition-colors shadow-sm"
            >
              Back
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={handleNext}
            className="flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 rounded-full min-w-[108px] h-[40px] px-4 font-semibold text-sm transition-colors shadow-sm"
          >
            Next
          </motion.button>
        </div>
      </div>
    </div>
  )
}
