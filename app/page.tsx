"use client";

import React, { useState, useEffect, useCallback } from "react";
import JSZip from "jszip";
import { Download, RefreshCw, Play, Info, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { UserMenu } from "./components/auth/UserMenu";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { SiteData, DEFAULT_DATA, Service, TeamMember } from "./lib/types";
import { processImage, createPlaceholderImage, processLogo, processHero, processFavicon, processServiceImage, processTeamPhoto } from "./lib/imageProcessor";
import { generateSite } from "./lib/siteGenerator";
import ImageUpload from "./components/ImageUpload";

// Helper to convert File to data URL for live preview
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(file);
  });
}

export default function GreekBusinessWebsiteCreator() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Client-side protection as a safety net (middleware should handle most redirects)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show a simple loading state while we determine auth status
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 animate-spin" size={32} />
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  const [data, setData] = useState<SiteData>(DEFAULT_DATA);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [lastGeneratedZip, setLastGeneratedZip] = useState<Blob | null>(null);
  const [lastGeneratedManifest, setLastGeneratedManifest] = useState<string[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isBuildingPreview, setIsBuildingPreview] = useState(false);
  const [previewPage, setPreviewPage] = useState<'home' | 'services' | 'about' | 'contact'>('home');

  // Update a top-level field
  const update = (field: keyof SiteData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  // Update nested contact etc (not needed much)
  const updateBusiness = (field: keyof SiteData, value: any) => {
    update(field, value);
  };

  // Services management
  const addService = () => {
    if (data.services.length >= 6) return;
    const newSvc: Service = {
      id: "s" + Date.now(),
      title: "Νέα Υπηρεσία",
      description: "Περιγραφή της υπηρεσίας...",
      image: null,
    };
    update("services", [...data.services, newSvc]);
  };

  const updateService = (id: string, field: keyof Service, value: any) => {
    update(
      "services",
      data.services.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const removeService = (id: string) => {
    update("services", data.services.filter((s) => s.id !== id));
    // cleanup preview
    setPreviews((p) => {
      const copy = { ...p };
      delete copy[`service-${id}`];
      return copy;
    });
  };

  // Team
  const addTeamMember = () => {
    if (data.team.length >= 5) return;
    const newMember: TeamMember = {
      id: "t" + Date.now(),
      name: "Νέο Μέλος",
      role: "Θέση",
      bio: "Σύντομη περιγραφή...",
      photo: null,
    };
    update("team", [...data.team, newMember]);
  };

  const updateTeam = (id: string, field: keyof TeamMember, value: any) => {
    update(
      "team",
      data.team.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const removeTeam = (id: string) => {
    update("team", data.team.filter((m) => m.id !== id));
    setPreviews((p) => {
      const copy = { ...p };
      delete copy[`team-${id}`];
      return copy;
    });
  };

  // Image handlers with live preview generation
  const handleImage = async (
    kind: "logo" | "hero" | "favicon" | "service" | "team",
    file: File | null,
    serviceId?: string,
    teamId?: string
  ) => {
    if (!file) {
      // remove
      if (kind === "logo") update("logo", null);
      if (kind === "hero") update("hero", null);
      if (kind === "favicon") update("favicon", null);
      if (kind === "service" && serviceId) {
        updateService(serviceId, "image", null);
      }
      if (kind === "team" && teamId) updateTeam(teamId, "photo", null);
      setPreviews((p) => {
        const c = { ...p };
        const key = kind === "service" ? `service-${serviceId}` : kind === "team" ? `team-${teamId}` : kind;
        delete c[key];
        return c;
      });
      return;
    }

    // Create immediate preview (raw)
    const rawPreview = await fileToDataUrl(file);
    const key = kind === "service" ? `service-${serviceId}` : kind === "team" ? `team-${teamId}` : kind;
    setPreviews((prev) => ({ ...prev, [key]: rawPreview }));

    // Store original file
    if (kind === "logo") update("logo", file);
    if (kind === "hero") update("hero", file);
    if (kind === "favicon") update("favicon", file);
    if (kind === "service" && serviceId) updateService(serviceId, "image", file);
    if (kind === "team" && teamId) updateTeam(teamId, "photo", file);
  };

  // Load Demo Data (fully self-contained, generates placeholder images)
  const loadDemoData = async () => {
    setData(DEFAULT_DATA);
    setPreviews({});

    // Create beautiful placeholder images using canvas
    const primary = DEFAULT_DATA.primaryColor;
    const secondary = DEFAULT_DATA.secondaryColor;

    const [logoPh, heroPh] = await Promise.all([
      createPlaceholderImage(520, 220, primary, "AKMH", "#ffffff"),
      createPlaceholderImage(1920, 920, "#0f172a", "ΕΠΑΓΓΕΛΜΑΤΙΚΕΣ ΥΠΗΡΕΣΙΕΣ", "#e2e8f0"),
    ]);

    // Convert to real Files for consistency
    const logoFile = new File([logoPh.blob], "logo-demo.jpg", { type: "image/jpeg" });
    const heroFile = new File([heroPh.blob], "hero-demo.jpg", { type: "image/jpeg" });

    const newData: SiteData = {
      ...DEFAULT_DATA,
      logo: logoFile,
      hero: heroFile,
    };

    // Process service + team placeholders too
    const svcImages = await Promise.all(
      DEFAULT_DATA.services.map(async (s, i) =>
        createPlaceholderImage(800, 520, i === 0 ? primary : i === 1 ? secondary : "#334155", s.title.slice(0, 18))
      )
    );

    const teamImages = await Promise.all(
      DEFAULT_DATA.team.map((t) =>
        createPlaceholderImage(620, 620, "#1e2937", t.name.split(" ").slice(0, 2).join(" "))
      )
    );

    newData.services = DEFAULT_DATA.services.map((s, i) => ({
      ...s,
      image: new File([svcImages[i].blob], `svc-${i}.jpg`, { type: "image/jpeg" }),
    }));
    newData.team = DEFAULT_DATA.team.map((t, i) => ({
      ...t,
      photo: new File([teamImages[i].blob], `team-${i}.jpg`, { type: "image/jpeg" }),
    }));

    setData(newData);

    // Set raw previews
    setPreviews({
      logo: logoPh.dataUrl,
      hero: heroPh.dataUrl,
      ...Object.fromEntries(newData.services.map((s, i) => [`service-${s.id}`, svcImages[i].dataUrl])),
      ...Object.fromEntries(newData.team.map((t, i) => [`team-${t.id}`, teamImages[i].dataUrl])),
    });

    setPreviewPage('home');
    toast.success("Δημιουργήθηκαν demo δεδομένα. Μπορείτε να τα τροποποιήσετε.");
  };

  const resetAll = () => {
    setData(DEFAULT_DATA);
    setPreviews({});
    setLastGeneratedZip(null);
    setLastGeneratedManifest([]);
    setPreviewHtml("");
    setPreviewPage('home');
    toast.info("Επαναφορά σε προεπιλεγμένες τιμές");
  };

  /**
   * Prepare a single page's HTML for use inside the srcDoc iframe preview.
   * - Inlines the full CSS (so we never request /assets/styles.css from the Next dev server)
   * - Replaces image asset paths with data: URLs from current uploads/previews
   * - Neutralizes all internal navigation links (href="*.html") so they don't cause 404s
   *   or navigate the iframe away. This is the main fix for the reported 404 spam.
   */
  function preparePreviewHtml(rawHtml: string, cssText: string, currentPreviews: Record<string, string>): string {
    let html = rawHtml;

    // 1. INLINE THE STYLESHEET — this is the #1 cause of 404s
    // Remove the external link and inject the full CSS as a <style> block.
    html = html.replace(
      /<link[^>]*rel=["']stylesheet["'][^>]*href=["']assets\/styles\.css["'][^>]*>/gi,
      ''
    );
    // Insert right before </head> (or at end of head if no </head>)
    if (html.includes('</head>')) {
      html = html.replace('</head>', `<style>\n${cssText}\n</style>\n</head>`);
    } else {
      html = html.replace('<head>', `<head>\n<style>\n${cssText}\n</style>`);
    }

    // 2. IMAGE REPLACEMENTS (same robust logic as before, now on the inlined HTML)

    // Logo
    if (currentPreviews.logo) {
      html = html.replace(/src="assets\/[^"]*logo[^"]*"/gi, `src="${currentPreviews.logo}"`);
      html = html.replace(/src='assets\/[^']*logo[^']*'/gi, `src='${currentPreviews.logo}'`);
    }

    // Hero (background + src)
    if (currentPreviews.hero) {
      html = html.replace(/url\(['"]?assets\/[^'")]*hero[^'")]*['"]?\)/gi, `url(${currentPreviews.hero})`);
      html = html.replace(/src="assets\/[^"]*hero[^"]*"/gi, `src="${currentPreviews.hero}"`);
    }

    // Favicon
    if (currentPreviews.favicon) {
      html = html.replace(/href="assets\/favicon[^"]*"/gi, `href="${currentPreviews.favicon}"`);
    } else {
      html = html.replace(/href="assets\/favicon[^"]*"/gi, `href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="`);
    }

    // Services (by current data order)
    data.services.forEach((svc, idx) => {
      const key = `service-${svc.id}`;
      if (currentPreviews[key]) {
        const re = new RegExp(`(src|href)=["']assets/service-${idx + 1}\\.(jpg|jpeg|png)["']`, "gi");
        html = html.replace(re, `$1="${currentPreviews[key]}"`);
      }
    });

    // Team
    data.team.forEach((member, idx) => {
      const key = `team-${member.id}`;
      if (currentPreviews[key]) {
        const re = new RegExp(`(src|href)=["']assets/team-${idx + 1}\\.(jpg|jpeg|png)["']`, "gi");
        html = html.replace(re, `$1="${currentPreviews[key]}"`);
      }
    });

    // Remaining asset images → nice placeholder (prevents any stray 404s)
    html = html.replace(
      /src="assets\/[^"]+\.(jpg|jpeg|png)"/gi,
      'src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27400%27 height=%27300%27%3E%3Crect fill=%27%23f1f5f9%27 width=%27400%27 height=%27300%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 fill=%27%2364758b%27 font-size=%2714%27 text-anchor=%27middle%27%3Eεικόνα%3C/text%3E%3C/svg%27"'
    );

    // 3. NEUTRALIZE ALL INTERNAL PAGE LINKS
    // This stops <a href="services.html"> etc. from causing the iframe to request /services.html (404)
    // and keeps the preview stable on the currently viewed page.
    html = html.replace(
      /<a([^>]*?)href=["'](index|services|about|contact)\.html["']([^>]*?)>/gi,
      (_match, before, _page, after) => {
        // Keep other attributes, force no navigation
        return `<a${before}href="#" onclick="event.preventDefault();return false;" title="Δεν είναι ενεργό στο preview" ${after}>`;
      }
    );

    // Also catch any other *.html links that might exist
    html = html.replace(
      /<a([^>]*?)href=["'][^"']+\.html["']([^>]*?)>/gi,
      (_match, before, after) => `<a${before}href="#" onclick="event.preventDefault();return false;" ${after}>`
    );

    // 4. Small non-intrusive badge
    html = html.replace(
      "</body>",
      `<div style="position:fixed;bottom:8px;right:8px;background:#0f172a;color:#64748b;font-size:9px;padding:1px 7px;border-radius:2px;opacity:0.55;letter-spacing:.5px;font-family:system-ui;pointer-events:none;">LIVE PREVIEW</div></body>`
    );

    return html;
  }

  // Build (or rebuild) the live preview for the currently selected page.
  // This version inlines CSS and neutralizes nav links → no more /assets/styles.css or /index.html 404s from the iframe.
  const buildLivePreview = useCallback(async () => {
    setIsBuildingPreview(true);
    try {
      const result = await generateSite(data);

      // Get the raw CSS as text (from the files map)
      const cssBlob = result.files['assets/styles.css'];
      const cssText = typeof cssBlob === 'string' ? cssBlob : await (cssBlob as Blob).text();

      // Pick the correct raw page HTML based on current tab
      let rawPageHtml: string;
      switch (previewPage) {
        case 'services':
          rawPageHtml = result.pages.services;
          break;
        case 'about':
          rawPageHtml = result.pages.about;
          break;
        case 'contact':
          rawPageHtml = result.pages.contact;
          break;
        default:
          rawPageHtml = result.pages.home;
      }

      const prepared = preparePreviewHtml(rawPageHtml, cssText, previews);
      setPreviewHtml(prepared);
    } catch (e) {
      console.error(e);
      toast.error("Σφάλμα κατά τη δημιουργία προεπισκόπησης");
    } finally {
      setIsBuildingPreview(false);
    }
  }, [data, previews, previewPage]);

  // Debounced auto preview rebuild (when form data or uploads change)
  useEffect(() => {
    const t = setTimeout(() => {
      buildLivePreview();
    }, 420);
    return () => clearTimeout(t);
  }, [data, previews, buildLivePreview]);

  // When user explicitly switches preview tab, rebuild immediately for that page
  useEffect(() => {
    // Use a microtask so the state update has settled and the latest buildLivePreview (with new previewPage) is used
    const id = setTimeout(() => {
      buildLivePreview();
    }, 0);
    return () => clearTimeout(id);
  }, [previewPage, buildLivePreview]);

  // Test generation without zipping/download (great for verification)
  const testGenerateOnly = async () => {
    setIsGenerating(true);
    setGenerationProgress("Εκτέλεση δοκιμαστικής γεννήτριας...");
    try {
      const { files } = await generateSite(data);
      const manifest = Object.keys(files).sort();
      setLastGeneratedManifest(manifest);

      toast.success(`Επιτυχής δοκιμή! ${manifest.length} αρχεία/πόροι δημιουργήθηκαν.`);
    } catch (e) {
      console.error(e);
      toast.error("Σφάλμα δοκιμής γεννήτριας");
    } finally {
      setIsGenerating(false);
      setGenerationProgress("");
    }
  };

  // Main generation + ZIP
  const generateAndDownload = async () => {
    // Minimal validation
    if (!data.legalName || !data.displayName || !data.email || !data.phone) {
      toast.error("Συμπληρώστε τουλάχιστον: Επωνυμία, Επωνυμία Προβολής, Email και Τηλέφωνο.");
      return;
    }
    if (data.services.length === 0) {
      toast.error("Προσθέστε τουλάχιστον μία υπηρεσία.");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress("Προετοιμασία εικόνων...");

    try {
      // Generate everything (images optimized inside)
      setGenerationProgress("Βελτιστοποίηση εικόνων & δημιουργία HTML...");
      const { files } = await generateSite(data);

      setGenerationProgress("Συμπίεση σε ZIP αρχείο...");

      const zip = new JSZip();

      // Add every file (string or Blob)
      for (const [path, content] of Object.entries(files)) {
        if (typeof content === "string") {
          zip.file(path, content);
        } else {
          zip.file(path, content);
        }
      }

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      // Download
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      const safeName = data.displayName
        .toLowerCase()
        .replace(/[^a-z0-9\u0370-\u03ff]/g, "-")
        .replace(/-+/g, "-");
      a.href = url;
      a.download = `${safeName}-website.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLastGeneratedZip(zipBlob);
      // Also record manifest for inspection
      setLastGeneratedManifest(Object.keys(files).sort());

      // Success UX
      confetti({
        particleCount: 180,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 90,
          angle: 60,
          spread: 55,
          origin: { x: 0.1 },
        });
      }, 180);

      toast.success("Το ZIP δημιουργήθηκε επιτυχώς! Έτοιμο για ανέβασμα σε hosting.", {
        duration: 6000,
      });
    } catch (err) {
      console.error(err);
      toast.error("Παρουσιάστηκε σφάλμα κατά τη δημιουργία. Δείτε την κονσόλα.");
    } finally {
      setIsGenerating(false);
      setGenerationProgress("");
    }
  };

  const downloadLastZipAgain = () => {
    if (!lastGeneratedZip) return;
    const url = URL.createObjectURL(lastGeneratedZip);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.displayName.toLowerCase().replace(/\s+/g, "-")}-website.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const openPreviewInNewTab = () => {
    if (!previewHtml) return;
    const w = window.open("", "_blank");
    if (w) {
      // Strip the LIVE PREVIEW badge for the clean "open in tab" experience
      const clean = previewHtml.replace(
        /<div[^>]*>LIVE PREVIEW<\/div><\/body>/,
        '</body>'
      );
      w.document.write(clean);
      w.document.close();
    }
  };

  // Color helpers
  const setColor = (which: "primary" | "secondary", hex: string) => {
    if (which === "primary") update("primaryColor", hex);
    else update("secondaryColor", hex);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top Bar */}
      <header className="border-b bg-white sticky top-0 z-40">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0A3D62] text-white flex items-center justify-center font-bold text-xl tracking-tighter">GR</div>
            <div>
              <div className="font-semibold tracking-tight text-xl">Greek Business Websites</div>
              <div className="text-[10px] text-zinc-500 -mt-1">ΔΗΜΙΟΥΡΓΟΣ ΣΥΜΒΑΤΩΝ ΙΣΤΟΣΕΛΙΔΩΝ ΓΙΑ ΕΛΛΗΝΙΚΕΣ ΕΠΙΧΕΙΡΗΣΕΙΣ</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
              <Check size={14} /> 100% Στατικό • Έτοιμο για Γ.Ε.ΜΗ.
            </div>
            <button onClick={loadDemoData} className="btn btn-secondary text-sm px-4 py-2">
              <Play size={15} /> Φόρτωση Demo
            </button>
            <button onClick={resetAll} className="btn btn-ghost text-sm px-3">
              <RefreshCw size={15} /> Reset
            </button>
            <button
              onClick={generateAndDownload}
              disabled={isGenerating}
              className="btn btn-primary gap-2 px-5 disabled:opacity-70"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={17} /> {generationProgress || "Δημιουργία..."}
                </>
              ) : (
                <>
                  <Download size={17} /> Λήψη ZIP
                </>
              )}
            </button>
            {lastGeneratedZip && (
              <button onClick={downloadLastZipAgain} className="btn btn-secondary text-sm">
                Κατέβασε ξανά
              </button>
            )}

            <UserMenu />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-5 pt-8 pb-24">
        {/* Hero intro */}
        <div className="max-w-3xl mb-9">
          <div className="uppercase tracking-[1.5px] text-xs font-semibold text-[#0A3D62] mb-2">ΓΙΑ Ι.Κ.Ε., Ο.Ε., Ε.Π.Ε. &amp; ΑΤΟΜΙΚΕΣ ΕΠΙΧΕΙΡΗΣΕΙΣ</div>
          <h1 className="text-4xl font-semibold tracking-tighter">Δημιουργήστε επαγγελματική &amp; πλήρως συμμορφωμένη ιστοσελίδα σε λεπτά</h1>
          <p className="mt-3 text-lg text-zinc-600">
            Στατικό HTML/CSS/JS πακέτο έτοιμο για ανέβασμα σε Hostinger, cPanel ή οποιοδήποτε hosting. Περιλαμβάνει όλα τα νομικά στοιχεία (Γ.Ε.ΜΗ., ΑΦΜ, Έδρα).
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* FORM */}
          <div className="xl:col-span-7 space-y-6">
            {/* 1. Business Identity */}
            <div className="form-card p-7">
              <div className="section-header">1. Ταυτότητα Επιχείρησης (Νομικά Στοιχεία)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="label">Πλήρης Νομική Επωνυμία *</div>
                  <input className="input" value={data.legalName} onChange={(e) => updateBusiness("legalName", e.target.value)} placeholder="ΑΚΜΗ ΥΠΗΡΕΣΙΕΣ Ι.Κ.Ε." />
                </div>
                <div>
                  <div className="label">Επωνυμία Προβολής (Brand) *</div>
                  <input className="input" value={data.displayName} onChange={(e) => updateBusiness("displayName", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <div className="label">Tagline / Σύνθημα</div>
                  <input className="input" value={data.tagline} onChange={(e) => updateBusiness("tagline", e.target.value)} />
                </div>

                <div>
                  <div className="label">Γ.Ε.ΜΗ. (Γενικό Εμπορικό Μητρώο) *</div>
                  <input className="input font-mono" value={data.gemi} onChange={(e) => updateBusiness("gemi", e.target.value)} placeholder="123456789000" />
                </div>
                <div>
                  <div className="label">ΑΦΜ *</div>
                  <input className="input font-mono" value={data.afm} onChange={(e) => updateBusiness("afm", e.target.value)} />
                </div>
                <div>
                  <div className="label">Νομική Μορφή</div>
                  <input className="input" value={data.legalForm} onChange={(e) => updateBusiness("legalForm", e.target.value)} placeholder="Ι.Κ.Ε." />
                </div>
                <div>
                  <div className="label">Έδρα / Καταστατική Διεύθυνση *</div>
                  <input className="input" value={data.registeredAddress} onChange={(e) => updateBusiness("registeredAddress", e.target.value)} />
                </div>
              </div>
              <div className="mt-3 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <Info size={14} className="inline mr-1" /> Αυτά τα στοιχεία εμφανίζονται υποχρεωτικά στο footer σύμφωνα με την ελληνική νομοθεσία.
              </div>
            </div>

            {/* 2. Contact */}
            <div className="form-card p-7">
              <div className="section-header">2. Στοιχεία Επικοινωνίας</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="label">Email *</div>
                  <input type="email" className="input" value={data.email} onChange={(e) => updateBusiness("email", e.target.value)} />
                </div>
                <div>
                  <div className="label">Τηλέφωνο *</div>
                  <input className="input" value={data.phone} onChange={(e) => updateBusiness("phone", e.target.value)} />
                </div>
                <div>
                  <div className="label">Website (προαιρετικό)</div>
                  <input className="input" value={data.website || ""} onChange={(e) => updateBusiness("website", e.target.value)} />
                </div>
              </div>
            </div>

            {/* 3. Branding + Colors + Images */}
            <div className="form-card p-7">
              <div className="section-header">3. Επωνυμία &amp; Χρώματα</div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                <div className="lg:col-span-3 space-y-5">
                  <ImageUpload
                    label="Λογότυπο"
                    recommended="Συνιστώμενο: 420×180px ή 1:1, PNG με διαφάνεια"
                    currentFile={data.logo}
                    previewUrl={previews.logo}
                    onFileSelect={(f) => handleImage("logo", f)}
                    onRemove={() => handleImage("logo", null)}
                  />
                  <ImageUpload
                    label="Hero / Κεντρική Εικόνα"
                    recommended="1920×1080 ή 16:9. Επαγγελματική φωτογραφία γραφείων ή ομάδας"
                    currentFile={data.hero}
                    previewUrl={previews.hero}
                    onFileSelect={(f) => handleImage("hero", f)}
                    onRemove={() => handleImage("hero", null)}
                    aspect="16:9"
                  />
                  <ImageUpload
                    label="Favicon (Εικονίδιο καρτέλας)"
                    recommended="Τετράγωνη εικόνα, ιδανικά 256×256"
                    currentFile={data.favicon}
                    previewUrl={previews.favicon}
                    onFileSelect={(f) => handleImage("favicon", f)}
                    onRemove={() => handleImage("favicon", null)}
                    aspect="1:1"
                  />
                </div>

                {/* Colors */}
                <div className="lg:col-span-2">
                  <div className="label mb-2">Χρωματικός Συνδυασμός</div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-zinc-500 mb-1.5">Κύριο χρώμα (Primary)</div>
                      <div className="flex gap-3 items-center">
                        <input
                          type="color"
                          value={data.primaryColor}
                          onChange={(e) => setColor("primary", e.target.value)}
                          className="color-input"
                        />
                        <input
                          className="input font-mono text-sm"
                          value={data.primaryColor}
                          onChange={(e) => setColor("primary", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 mb-1.5">Δευτερεύον χρώμα (Secondary)</div>
                      <div className="flex gap-3 items-center">
                        <input
                          type="color"
                          value={data.secondaryColor}
                          onChange={(e) => setColor("secondary", e.target.value)}
                          className="color-input"
                        />
                        <input
                          className="input font-mono text-sm"
                          value={data.secondaryColor}
                          onChange={(e) => setColor("secondary", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="text-xs text-zinc-500 mb-2">Γρήγορες επιλογές</div>
                      <div className="flex flex-wrap gap-2">
                        {["#0A3D62", "#1E3A5F", "#0F172A", "#1E40AF", "#854D0E", "#166534"].map((c) => (
                          <button
                            key={c}
                            onClick={() => setColor("primary", c)}
                            className="color-swatch"
                            style={{ background: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-[11px] leading-snug text-zinc-500 pt-1">
                      Τα χρώματα εφαρμόζονται αυτόματα σε όλα τα κουμπιά, συνδέσμους και accents.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Hero text */}
            <div className="form-card p-7">
              <div className="section-header">4. Κείμενο Αρχικής</div>
              <div>
                <div className="label">Σύντομη Περιγραφή (Hero / Intro)</div>
                <textarea
                  className="input min-h-[92px]"
                  value={data.shortDescription}
                  onChange={(e) => updateBusiness("shortDescription", e.target.value)}
                />
              </div>
            </div>

            {/* 5. Services */}
            <div className="form-card p-7">
              <div className="flex justify-between items-center mb-3">
                <div className="section-header mb-0">5. Υπηρεσίες ({data.services.length})</div>
                <button onClick={addService} className="btn btn-secondary text-xs px-3 py-1.5">+ Προσθήκη Υπηρεσίας</button>
              </div>

              <div className="space-y-4">
                {data.services.map((svc, index) => (
                  <div key={svc.id} className="service-card">
                    <div className="flex justify-between mb-3">
                      <div className="text-xs font-semibold text-zinc-500">ΥΠΗΡΕΣΙΑ #{index + 1}</div>
                      <button onClick={() => removeService(svc.id)} className="text-red-500 text-xs hover:underline">Αφαίρεση</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-3 space-y-3">
                        <div>
                          <div className="label">Τίτλος Υπηρεσίας</div>
                          <input className="input" value={svc.title} onChange={(e) => updateService(svc.id, "title", e.target.value)} />
                        </div>
                        <div>
                          <div className="label">Περιγραφή</div>
                          <textarea className="input min-h-[74px]" value={svc.description} onChange={(e) => updateService(svc.id, "description", e.target.value)} />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <ImageUpload
                          label="Εικόνα Υπηρεσίας (προαιρετικό)"
                          recommended="800×600 ή παρόμοιο"
                          currentFile={svc.image}
                          previewUrl={previews[`service-${svc.id}`]}
                          onFileSelect={(f) => handleImage("service", f, svc.id)}
                          onRemove={() => handleImage("service", null, svc.id)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {data.services.length === 0 && <div className="text-sm text-zinc-500">Δεν υπάρχουν υπηρεσίες. Προσθέστε τουλάχιστον 1.</div>}
              </div>
            </div>

            {/* 6. About + Team */}
            <div className="form-card p-7">
              <div className="section-header">6. Σχετικά με την Εταιρεία</div>
              <div className="space-y-4">
                <div>
                  <div className="label">Κείμενο "Σχετικά" (About Us)</div>
                  <textarea className="input min-h-[120px]" value={data.aboutText} onChange={(e) => updateBusiness("aboutText", e.target.value)} />
                </div>
                <div>
                  <div className="label">Αποστολή / Mission</div>
                  <textarea className="input min-h-[74px]" value={data.missionText} onChange={(e) => updateBusiness("missionText", e.target.value)} />
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between mb-3">
                  <div className="font-semibold text-sm">Ομάδα ({data.team.length})</div>
                  <button onClick={addTeamMember} className="btn btn-secondary text-xs px-3 py-1">+ Προσθήκη Μέλους</button>
                </div>

                {data.team.length > 0 && (
                  <div className="space-y-4">
                    {data.team.map((member) => (
                      <div key={member.id} className="team-card">
                        <div className="flex justify-between mb-3">
                          <div className="text-xs text-zinc-500">ΜΕΛΟΣ ΟΜΑΔΑΣ</div>
                          <button onClick={() => removeTeam(member.id)} className="text-red-500 text-xs">Αφαίρεση</button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-x-5 gap-y-3">
                          <div>
                            <div className="label">Ονοματεπώνυμο</div>
                            <input className="input" value={member.name} onChange={(e) => updateTeam(member.id, "name", e.target.value)} />
                          </div>
                          <div>
                            <div className="label">Θέση / Ρόλος</div>
                            <input className="input" value={member.role} onChange={(e) => updateTeam(member.id, "role", e.target.value)} />
                          </div>
                          <div className="md:col-span-2">
                            <div className="label">Σύντομο Βιογραφικό</div>
                            <textarea className="input min-h-16" value={member.bio} onChange={(e) => updateTeam(member.id, "bio", e.target.value)} />
                          </div>
                          <div className="md:col-span-2">
                            <ImageUpload
                              label="Φωτογραφία"
                              recommended="Τετράγωνη, 640×640 ιδανικά"
                              currentFile={member.photo}
                              previewUrl={previews[`team-${member.id}`]}
                              onFileSelect={(f) => handleImage("team", f, undefined, member.id)}
                              onRemove={() => handleImage("team", null, undefined, member.id)}
                              aspect="1:1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Generate controls at bottom of form */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={generateAndDownload}
                disabled={isGenerating}
                className="btn btn-primary text-base px-8 py-3 flex-1 sm:flex-none"
              >
                {isGenerating ? "Δημιουργία σε εξέλιξη..." : "ΔΗΜΙΟΥΡΓΙΑ & ΛΗΨΗ ZIP"}
              </button>
              <button onClick={openPreviewInNewTab} disabled={!previewHtml} className="btn btn-secondary">
                Άνοιγμα Preview σε νέα καρτέλα
              </button>
              <button onClick={testGenerateOnly} disabled={isGenerating} className="btn btn-ghost text-sm">
                Δοκιμή Γεννήτριας (χωρίς ZIP)
              </button>
            </div>
            <div className="text-xs text-zinc-500 px-1">
              Το παραγόμενο ZIP περιέχει 100% στατικό κώδικα. Καμία εξωτερική εξάρτηση δεν απαιτείται για το hosting.
            </div>

            {/* Manifest from last test/generate (for verification) */}
            {lastGeneratedManifest.length > 0 && (
              <div className="mt-4 p-4 bg-zinc-900 text-emerald-400 rounded-xl text-xs font-mono overflow-auto max-h-[210px]">
                <div className="text-emerald-300 mb-1.5 font-sans text-[10px] tracking-widest">ΤΕΛΕΥΤΑΙΑ ΓΕΝΝΗΤΡΙΑ — {lastGeneratedManifest.length} ΑΡΧΕΙΑ</div>
                {lastGeneratedManifest.map((p) => (
                  <div key={p}>• {p}</div>
                ))}
              </div>
            )}
          </div>

          {/* LIVE PREVIEW PANE */}
          <div className="xl:col-span-5">
            <div className="sticky top-20">
              <div className="flex items-center justify-between mb-2 px-1">
                <div>
                  <span className="font-semibold">Ζωντανή Προεπισκόπηση</span>
                  <span className="ml-2 text-xs px-2 py-px bg-zinc-200 rounded">srcDoc iframe</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={buildLivePreview} disabled={isBuildingPreview} className="text-xs btn btn-ghost px-3 py-1">
                    {isBuildingPreview ? "Ανανέωση..." : "Ανανέωση Preview"}
                  </button>
                  <button onClick={openPreviewInNewTab} disabled={!previewHtml} className="text-xs btn btn-secondary px-3 py-1">
                    Νέα καρτέλα
                  </button>
                </div>
              </div>

              {/* Preview page tabs — switching these will never cause 404s because we inline everything */}
              <div className="flex items-center gap-1 mb-2 px-1">
                {[
                  { key: 'home' as const, label: 'Αρχική' },
                  { key: 'services' as const, label: 'Υπηρεσίες' },
                  { key: 'about' as const, label: 'Σχετικά' },
                  { key: 'contact' as const, label: 'Επικοινωνία' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      if (previewPage !== tab.key) {
                        setPreviewPage(tab.key);
                        // The dedicated useEffect above will trigger an immediate rebuild
                        // with the correct latest buildLivePreview closure for this page.
                      }
                    }}
                    className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                      previewPage === tab.key
                        ? 'bg-white text-[#0A3D62] shadow-sm border border-[#0A3D62]/20'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="preview-container">
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="preview-frame w-full"
                    title="Live website preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : (
                  <div className="h-[720px] flex items-center justify-center text-zinc-400 bg-zinc-900 rounded-md">
                    <div className="text-center">
                      <Loader2 className="mx-auto mb-3 animate-spin" />
                      <div>Φόρτωση προεπισκόπησης...</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-zinc-500 mt-2 px-1 leading-snug">
                Η προεπισκόπηση ενημερώνεται αυτόματα. Όλα τα assets (CSS + εικόνες) είναι inline ή data: URLs, οπότε δεν γίνονται αιτήματα προς τον Next.js server.
              </div>

              {/* What you get */}
              <div className="mt-7 rounded-xl border bg-white p-5 text-sm">
                <div className="font-semibold mb-2">Τι περιλαμβάνει το ZIP</div>
                <ul className="space-y-[5px] text-zinc-600 text-[13px]">
                  <li>• 4 πλήρεις σελίδες HTML (index, services, about, contact)</li>
                  <li>• assets/styles.css με τα δικά σας χρώματα</li>
                  <li>• Όλες οι εικόνες βελτιστοποιημένες (JPEG/PNG)</li>
                  <li>• robots.txt + sitemap.xml (έτοιμα για SEO)</li>
                  <li>• .htaccess (caching, security, 404)</li>
                  <li>• 404.html</li>
                  <li>• Αναλυτικό README.md με οδηγίες Hostinger / cPanel + PHP φόρμας</li>
                </ul>
                <div className="pt-3 mt-3 border-t text-xs text-emerald-700">Πλήρως συμβατό με απαιτήσεις Γ.Ε.ΜΗ. / Π.Δ. 131/2003</div>
              </div>
            </div>
          </div>
        </div>

        {/* Documentation / How to use section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="font-semibold text-xl mb-4 tracking-tight">Οδηγίες Χρήσης</h2>
          <div className="grid md:grid-cols-2 gap-5 text-sm">
            <div className="rounded-2xl bg-white border p-6">
              <div className="font-semibold mb-3">Για τον τελικό χρήστη (ιδιοκτήτη επιχείρησης)</div>
              <ol className="list-decimal pl-5 space-y-1.5 text-zinc-600">
                <li>Συμπληρώστε τα νομικά στοιχεία (Γ.Ε.ΜΗ., ΑΦΜ, έδρα) με ακρίβεια.</li>
                <li>Ανεβάστε λογότυπο, hero εικόνα και φωτογραφίες ομάδας.</li>
                <li>Επιλέξτε χρώματα που ταιριάζουν στην ταυτότητα της εταιρείας σας.</li>
                <li>Πατήστε «Λήψη ZIP».</li>
                <li>Αποσυμπιέστε και ανεβάστε τα αρχεία στο hosting σας (δείτε το README μέσα στο ZIP).</li>
              </ol>
            </div>
            <div className="rounded-2xl bg-white border p-6">
              <div className="font-semibold mb-3">Για προγραμματιστές / web agencies</div>
              <ul className="space-y-1.5 text-zinc-600">
                <li>Το project είναι πλήρες Next.js app. Τρέξτε <code className="font-mono bg-zinc-100 px-1">npm run dev</code>.</li>
                <li>Μπορείτε να επεκτείνετε τις φόρμες, να προσθέσετε περισσότερα πεδία ή γλώσσες.</li>
                <li>Η γεννήτρια βρίσκεται στο <code className="font-mono bg-zinc-100 px-1">app/lib/siteGenerator.ts</code>.</li>
                <li>Το output είναι εντελώς ανεξάρτητο — μπορείτε να το χρησιμοποιήσετε και server-side.</li>
              </ul>
              <div className="mt-4 pt-4 border-t text-xs">Προσθέστε εύκολα περισσότερες σελίδες ή πολύγλωσσο περιεχόμενο.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <footer className="border-t py-5 text-center text-xs text-zinc-500 bg-white">
        Δημιουργήθηκε για γρήγορη και νόμιμη παρουσία ελληνικών επιχειρήσεων στο διαδίκτυο • Όλα τα παραγόμενα sites είναι self-contained static websites.
      </footer>
    </div>
  );
}
