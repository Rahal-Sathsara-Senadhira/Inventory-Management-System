import React, { useState } from "react";

const NewsletterStrip = () => {
  const [email, setEmail] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: hook up to your backend
    alert(`Subscribed: ${email}`);
    setEmail("");
  };

  return (
    <section
      className="
        relative z-20
        -mt-10                 /* pull up so it overlaps the image a bit */
        bg-[#0B1C10] text-white
      "
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <div className="font-semibold">Join our newsletter</div>
            <p className="text-white/70 text-sm">
              We’ll send you a nice letter once per week. No spam.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="flex w-full md:w-auto gap-2"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 md:w-80 px-4 py-2 rounded-md bg-white text-[#0B1C10] outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#1ED760] text-[#0B1C10] font-semibold hover:opacity-90"
            >
              Subscribe
            </button>
          </form>
        </div>

        <div className="mt-4 border-t border-white/10" />
      </div>
    </section>
  );
};

export default NewsletterStrip;
