export interface Service {
  id: string;
  title: string;
  description: string;
  image: File | null;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: File | null;
}

export interface SiteData {
  // Business Identity (Greek legal requirements)
  legalName: string; // Full legal name e.g. "ΑΚΜΗ ΛΟΓΙΣΤΙΚΕΣ ΥΠΗΡΕΣΙΕΣ Ι.Κ.Ε."
  displayName: string; // Brand name shown prominently
  tagline: string;
  shortDescription: string; // 1-2 sentence for hero/about intro
  gemi: string; // Γ.Ε.ΜΗ. number e.g. "123456789000"
  afm: string; // ΑΦΜ / VAT
  legalForm: string; // Ι.Κ.Ε. / Ο.Ε. / Ε.Π.Ε. etc.
  registeredAddress: string; // Full registered office

  // Contact
  email: string;
  phone: string;
  website?: string; // optional self-ref

  // Branding
  primaryColor: string; // #hex
  secondaryColor: string;

  // Images (raw user files, processed at generation time)
  logo: File | null;
  hero: File | null;
  favicon: File | null;

  // Content
  aboutText: string; // Full paragraph(s) for About page
  missionText: string;

  services: Service[];
  team: TeamMember[];
}

export const DEFAULT_DATA: SiteData = {
  legalName: "ΑΚΜΗ ΕΠΑΓΓΕΛΜΑΤΙΚΕΣ ΥΠΗΡΕΣΙΕΣ Ι.Κ.Ε.",
  displayName: "ΑΚΜΗ",
  tagline: "Αξιόπιστες λογιστικές και συμβουλευτικές υπηρεσίες από το 2008",
  shortDescription: "Παρέχουμε ολοκληρωμένες λογιστικές, φοροτεχνικές και επιχειρηματικές συμβουλευτικές υπηρεσίες σε επιχειρήσεις και ιδιώτες σε όλη την Ελλάδα.",
  gemi: "123456789000",
  afm: "998765432",
  legalForm: "Ι.Κ.Ε.",
  registeredAddress: "Λεωφόρος Κηφισίας 42, 151 25 Μαρούσι, Αττική",

  email: "info@akmi-services.gr",
  phone: "+30 210 123 4567",
  website: "www.akmi-services.gr",

  primaryColor: "#0A3D62",
  secondaryColor: "#1E5F8A",

  logo: null,
  hero: null,
  favicon: null,

  aboutText: "Η ΑΚΜΗ ιδρύθηκε το 2008 με σκοπό να προσφέρει υψηλού επιπέδου λογιστικές και συμβουλευτικές υπηρεσίες. Με πολυετή εμπειρία και βαθιά γνώση της ελληνικής και ευρωπαϊκής νομοθεσίας, υποστηρίζουμε καθημερινά δεκάδες επιχειρήσεις σε θέματα φορολογίας, λογιστικής, μισθοδοσίας και στρατηγικής ανάπτυξης.",
  missionText: "Αποστολή μας είναι να απλοποιούμε την καθημερινότητα των πελατών μας και να τους βοηθάμε να λαμβάνουν σωστές επιχειρηματικές αποφάσεις με ασφάλεια και διαφάνεια.",

  services: [
    {
      id: "s1",
      title: "Λογιστικές Υπηρεσίες",
      description: "Τήρηση βιβλίων, ισολογισμοί, φορολογικές δηλώσεις και πλήρης λογιστική υποστήριξη για όλες τις νομικές μορφές.",
      image: null,
    },
    {
      id: "s2",
      title: "Φοροτεχνικές Συμβουλές",
      description: "Σχεδιασμός φορολογικής στρατηγικής, έλεγχος φορολογικών υποχρεώσεων και υποστήριξη σε φορολογικούς ελέγχους.",
      image: null,
    },
    {
      id: "s3",
      title: "Μισθοδοσία & Εργασιακά",
      description: "Πλήρης διαχείριση μισθοδοσίας, ασφαλιστικές εισφορές, συμβάσεις και συμμόρφωση με την εργατική νομοθεσία.",
      image: null,
    },
  ],
  team: [
    {
      id: "t1",
      name: "Μαρία Παπαδοπούλου",
      role: "Διευθύνουσα Σύμβουλος & Λογίστρια Α' Τάξης",
      bio: "Πάνω από 18 χρόνια εμπειρίας στη λογιστική και φοροτεχνική υποστήριξη ελληνικών επιχειρήσεων.",
      photo: null,
    },
    {
      id: "t2",
      name: "Γιώργος Κωνσταντίνου",
      role: "Φοροτεχνικός Σύμβουλος",
      bio: "Ειδικός σε διεθνή φορολογία και μετασχηματισμούς επιχειρήσεων. Πρώην στέλεχος Υπουργείου Οικονομικών.",
      photo: null,
    },
  ],
};

export interface ProcessedImage {
  blob: Blob;
  filename: string; // e.g. "logo.png"
  dataUrl?: string; // for preview
}

export interface GeneratedSite {
  files: Record<string, Blob | string>; // path -> content. Blobs for binaries (used for ZIP)
  indexHtml: string; // convenience (raw, for backward compat)

  // Convenience: the four fully-built page HTML strings (with original asset paths).
  // These are ideal for inlining into the live preview.
  pages: {
    home: string;
    services: string;
    about: string;
    contact: string;
  };
}
