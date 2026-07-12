import { useState } from "react";
import { Plus, Trash3 } from "react-bootstrap-icons";
import { apiConfig } from "../../../config/apiConfig.js";
import { getIcon } from "../../../config/iconConfig.js";
import { showError, showSuccess } from "../../../utils/toast.jsx";
import { adminAboutApi } from "../../api/adminAboutApi.js";
import AdminButton from "../ui/AdminButton.jsx";
import AdminImageUploader from "../ui/AdminImageUploader.jsx";
import AdminInput from "../ui/AdminInput.jsx";
import AdminSelect from "../ui/AdminSelect.jsx";
import AdminTextarea from "../ui/AdminTextarea.jsx";

// Curated, meaningful icons for the value cards (searchable dropdown).
const ICON_OPTIONS = [
  "shieldCheck", "journalCheck", "geoAlt", "checkCircle", "patchCheck", "award",
  "heart", "key", "houses", "buildings", "cashCoin", "graphUpArrow",
  "lightbulb", "compass", "people", "star", "houseCheck", "bullseye",
].map((value) => ({ value, label: value }));

// Paragraph arrays are edited as plain text: one blank line between paragraphs.
const paragraphsToText = (list) => (Array.isArray(list) ? list.join("\n\n") : "");
const textToParagraphs = (text) =>
  String(text || "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

function SectionCard({ title, hint, children }) {
  return (
    <section className="border border-brand-forest/10 bg-white p-5 sm:p-6">
      <div className="mb-4 border-b border-brand-forest/10 pb-3">
        <h2 className="text-base font-black uppercase tracking-[0.02em] text-brand-forest">{title}</h2>
        {hint ? <p className="mt-1 text-xs text-brand-muted">{hint}</p> : null}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function AboutForm({ content }) {
  // Local editable copy. Arrays that are edited as textareas are kept in text form.
  const [form, setForm] = useState(() => ({
    hero: {
      eyebrow: content.hero?.eyebrow || "",
      title: content.hero?.title || "",
      subtitle: content.hero?.subtitle || "",
      image: content.hero?.image || "",
      imageAlt: content.hero?.imageAlt || "",
    },
    introText: paragraphsToText(content.intro),
    mission: { title: content.mission?.title || "", body: content.mission?.body || "" },
    vision: { title: content.vision?.title || "", body: content.vision?.body || "" },
    values: (content.values || []).map((value) => ({
      title: value.title || "",
      body: value.body || "",
      iconKey: value.iconKey || "checkCircle",
    })),
    founder: {
      eyebrow: content.founder?.eyebrow || "",
      name: content.founder?.name || "",
      role: content.founder?.role || "",
      origin: content.founder?.origin || "",
      photo: content.founder?.photo || "",
      photoAlt: content.founder?.photoAlt || "",
      bioText: paragraphsToText(content.founder?.bio),
      quote: content.founder?.quote || "",
    },
    showFounderOnTeam: Boolean(content.showFounderOnTeam),
    seo: {
      title: content.seo?.title || "",
      description: content.seo?.description || "",
      ogImage: content.seo?.ogImage || "",
    },
    closing: content.closing || "",
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (section, key, value) =>
    setForm((current) => ({ ...current, [section]: { ...current[section], [key]: value } }));

  const setValue = (index, key, value) =>
    setForm((current) => {
      const values = current.values.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      );
      return { ...current, values };
    });

  const addValue = () =>
    setForm((current) => ({
      ...current,
      values: [...current.values, { title: "", body: "", iconKey: "checkCircle" }],
    }));

  const removeValue = (index) =>
    setForm((current) => ({
      ...current,
      values: current.values.filter((_, itemIndex) => itemIndex !== index),
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Rebuild the exact shape the public About page expects.
    const payload = {
      seoKey: "about",
      hero: { ...form.hero },
      intro: textToParagraphs(form.introText),
      mission: { ...form.mission },
      vision: { ...form.vision },
      values: form.values
        .filter((value) => value.title.trim() || value.body.trim())
        .map((value) => ({ title: value.title, body: value.body, iconKey: value.iconKey || "checkCircle" })),
      founder: {
        eyebrow: form.founder.eyebrow,
        name: form.founder.name,
        role: form.founder.role,
        origin: form.founder.origin,
        photo: form.founder.photo,
        photoAlt: form.founder.photoAlt,
        bio: textToParagraphs(form.founder.bioText),
        quote: form.founder.quote,
      },
      showFounderOnTeam: form.showFounderOnTeam,
      seo: { ...form.seo },
      closing: form.closing,
    };

    if (!apiConfig.useApi) {
      showSuccess("Looks good. Saving is not ready yet.");
      return;
    }

    setIsSubmitting(true);
    try {
      await adminAboutApi.update(payload);
      showSuccess("About page saved successfully.");
    } catch (caughtError) {
      showError(caughtError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <SectionCard title="Top banner" hint="The big heading visitors see first on the About page.">
        <AdminInput label="Small label (eyebrow)" onChange={(e) => setField("hero", "eyebrow", e.target.value)} value={form.hero.eyebrow} />
        <AdminInput label="Main title" onChange={(e) => setField("hero", "title", e.target.value)} value={form.hero.title} />
        <AdminTextarea label="Subtitle" onChange={(e) => setField("hero", "subtitle", e.target.value)} value={form.hero.subtitle} />
        <div className="grid gap-4 md:grid-cols-2">
          <AdminImageUploader label="Banner image" value={form.hero.image} onChange={(e) => setField("hero", "image", e.target.value)} />
          <AdminInput label="Banner image description (alt text)" onChange={(e) => setField("hero", "imageAlt", e.target.value)} value={form.hero.imageAlt} />
        </div>
      </SectionCard>

      <SectionCard title="Who we are" hint="One blank line between paragraphs.">
        <AdminTextarea className="[&_textarea]:min-h-40" label="Intro paragraphs" onChange={(e) => setForm((c) => ({ ...c, introText: e.target.value }))} value={form.introText} />
      </SectionCard>

      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard title="Our Mission">
          <AdminInput label="Title" onChange={(e) => setField("mission", "title", e.target.value)} value={form.mission.title} />
          <AdminTextarea label="Text" onChange={(e) => setField("mission", "body", e.target.value)} value={form.mission.body} />
        </SectionCard>
        <SectionCard title="Our Vision">
          <AdminInput label="Title" onChange={(e) => setField("vision", "title", e.target.value)} value={form.vision.title} />
          <AdminTextarea label="Text" onChange={(e) => setField("vision", "body", e.target.value)} value={form.vision.body} />
        </SectionCard>
      </div>

      <SectionCard title="Our values" hint="The cards under mission & vision. Icon uses an icon name like shieldCheck, journalCheck, geoAlt, checkCircle.">
        <div className="grid gap-4">
          {form.values.map((value, index) => (
            <div className="grid gap-3 border border-brand-forest/10 bg-brand-cream/40 p-4" key={index}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-widest text-brand-muted">Value {index + 1}</span>
                <button
                  className="grid h-8 w-8 place-items-center border border-red-200 text-red-600 transition hover:bg-red-600 hover:text-white"
                  onClick={() => removeValue(index)}
                  title="Remove value"
                  type="button"
                >
                  <Trash3 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <AdminInput label="Title" onChange={(e) => setValue(index, "title", e.target.value)} value={value.title} />
                <div className="flex items-end gap-3">
                  <AdminSelect
                    className="w-48"
                    label="Icon"
                    options={ICON_OPTIONS}
                    onChange={(e) => setValue(index, "iconKey", e.target.value)}
                    value={value.iconKey}
                  />
                  <span className="mb-1 grid h-12 w-12 shrink-0 place-items-center bg-brand-forest text-white">
                    {(() => {
                      const PreviewIcon = getIcon(value.iconKey, "checkCircle");
                      return <PreviewIcon aria-hidden="true" className="h-6 w-6" />;
                    })()}
                  </span>
                </div>
              </div>
              <AdminTextarea label="Text" onChange={(e) => setValue(index, "body", e.target.value)} value={value.body} />
            </div>
          ))}
        </div>
        <div>
          <AdminButton icon={Plus} onClick={addValue} size="sm" type="button" variant="outline">
            Add value
          </AdminButton>
        </div>
      </SectionCard>

      <SectionCard title="Founder" hint="One blank line between bio paragraphs.">
        <div className="grid gap-4 md:grid-cols-2">
          <AdminInput label="Small label (eyebrow)" onChange={(e) => setField("founder", "eyebrow", e.target.value)} value={form.founder.eyebrow} />
          <AdminInput label="Name" onChange={(e) => setField("founder", "name", e.target.value)} value={form.founder.name} />
          <AdminInput label="Role / title" onChange={(e) => setField("founder", "role", e.target.value)} value={form.founder.role} />
          <AdminInput label="Origin / location" onChange={(e) => setField("founder", "origin", e.target.value)} value={form.founder.origin} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <AdminImageUploader label="Founder photo" value={form.founder.photo} onChange={(e) => setField("founder", "photo", e.target.value)} />
          <AdminInput label="Photo description (alt text)" onChange={(e) => setField("founder", "photoAlt", e.target.value)} value={form.founder.photoAlt} />
        </div>
        <AdminTextarea className="[&_textarea]:min-h-48" label="Biography paragraphs" onChange={(e) => setField("founder", "bioText", e.target.value)} value={form.founder.bioText} />
        <AdminTextarea label="Pull quote" onChange={(e) => setField("founder", "quote", e.target.value)} value={form.founder.quote} />
        <label className="flex cursor-pointer items-start gap-3 border border-brand-forest/10 bg-brand-cream/40 p-4">
          <input
            checked={form.showFounderOnTeam}
            className="mt-0.5 h-5 w-5 accent-brand-forest"
            onChange={(e) => setForm((c) => ({ ...c, showFounderOnTeam: e.target.checked }))}
            type="checkbox"
          />
          <span className="min-w-0">
            <span className="block text-sm font-extrabold text-brand-forest">Also show the founder on the Team page</span>
            <span className="mt-1 block text-xs text-brand-muted">Adds a founder card at the top of the public /agents page, linking here.</span>
          </span>
        </label>
      </SectionCard>

      <SectionCard title="Closing message" hint="The final line above the contact button.">
        <AdminTextarea label="Closing text" onChange={(e) => setForm((c) => ({ ...c, closing: e.target.value }))} value={form.closing} />
      </SectionCard>

      <SectionCard title="Search & sharing (SEO)" hint="Controls the browser tab title, Google description, and social share image for the About page.">
        <AdminInput label="Page title" onChange={(e) => setForm((c) => ({ ...c, seo: { ...c.seo, title: e.target.value } }))} value={form.seo.title} />
        <AdminTextarea label="Meta description" onChange={(e) => setForm((c) => ({ ...c, seo: { ...c.seo, description: e.target.value } }))} value={form.seo.description} />
        <div className="grid gap-4 md:grid-cols-2">
          <AdminImageUploader label="Social share image" value={form.seo.ogImage} onChange={(e) => setForm((c) => ({ ...c, seo: { ...c.seo, ogImage: e.target.value } }))} />
        </div>
      </SectionCard>

      <div className="sticky bottom-0 z-10 -mx-1 border-t border-brand-forest/10 bg-brand-cream/95 px-1 py-3 backdrop-blur">
        <AdminButton disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : "Save About Page"}
        </AdminButton>
      </div>
    </form>
  );
}

export default AboutForm;
