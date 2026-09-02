import React, { useEffect, useMemo, useRef, useState } from "react";
import "./index.css";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

const DEmblem = "/d-emblem.png";
/* =========================================================
   TYPES
========================================================= */

type Section =
  | "home"
  | "events"
  | "about"
  | "team"
  | "contact";

type EventCategory = "technical" | "non-technical";
type EventMode = "individual" | "team" | "individual-or-team";

type EventRound = {
  id: string;
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  mode: string;
};

type EventItem = {
  id: string;
  name: string;
  category: EventCategory;
  mode: EventMode;
  description: string;
  detailedDescription?: string;
  theme?: string;
  poster: string;
  posterImage?: string | null;
  teamSize: number;
  rules: string;
  eligibility: string;
  prize: string;
  whatsappLink?: string;
  enabled: boolean;
  rounds: EventRound[];
};

type Person = {
  id: string;
  role: string;
  name: string;
  initials: string;
  photo?: string | null;
  description: string;
};

type SiteConfig = {
  heroWelcome: string;
  heroTitle: string;
  heroYear: string;
  heroTaglineOne: string;
  heroTaglineTwo: string;
  heroTaglineThree: string;

  eventDate: string;
  registrationDeadline: string;

  aboutSubtitle: string;
  aboutLead: string;
  aboutDescription: string;
  department: string;
  institution: string;

  people: Person[];

  contactDepartment: string;
  contactInstitution: string;
  contactEmail: string;
  contactLocation: string;

  studentCoordinators: Array<{
    name: string;
    phone: string;
  }>;

  whatsapp: string;

  registrationEnabled: boolean;
};

type StudentDetails = {
  fullName: string;
  registerNumber: string;
  department: string;
  year: string;
  email: string;
  phone: string;
};

type TeamMember = {
  name: string;
  registerNumber: string;
};

type TeamDetails = {
  teamName: string;
  members: TeamMember[];
};

type Registration = {
  // Unique Firestore document / submission ID.
  id: string;
  // Permanent registration ID for the main student for this symposium session.
  studentRegistrationId: string;
  student: StudentDetails;
  selectedEvents: string[];
  teams: Record<string, TeamDetails>;
  // Register number -> permanent symposium registration ID.
  participantRegistrationIds: Record<string, string>;
  createdAt: string;
};

/* =========================================================
   DEFAULT DATA
========================================================= */

const DEPARTMENT_OPTIONS = [
  { label: "CSE A", value: "CSE A" },
  { label: "CSE B", value: "CSE B" },
  { label: "IT", value: "IT" },
  { label: "ECE", value: "ECE" },
  { label: "EEE", value: "EEE" },
  { label: "MECH", value: "MECH" },
  { label: "CIVIL", value: "CIVIL" },
  {label:  "MBA", value:   "MBA"}
];

const DEFAULT_EVENTS: EventItem[] = [
  {
    id: "ideathon",
    name: "IDEATHON",
    category: "technical",
    mode: "team",
    description:
      "Transform bold ideas into practical solutions through creativity, innovation and technology.",
    poster: "IDEA",
    teamSize: 4,
    rules:
      "Participants must present an original idea. Plagiarism is strictly prohibited.",
    eligibility:
      "Open to college students. Team participation required.",
    prize: "Exciting prizes and certificates",
    enabled: true,
    rounds: [
      {
        id: "ideathon-r1",
        name: "IDEA SUBMISSION",
        description: "Submit your innovative idea and problem statement.",
        date: "2026-09-10",
        startTime: "10:00",
        endTime: "11:00",
        venue: "Seminar Hall",
        mode: "Offline",
      },
      {
        id: "ideathon-r2",
        name: "FINAL PRESENTATION",
        description: "Shortlisted teams present their idea before the jury.",
        date: "2026-09-10",
        startTime: "14:00",
        endTime: "15:00",
        venue: "Main Auditorium",
        mode: "Offline",
      },
    ],
  },
  {
    id: "designing",
    name: "DESIGNING",
    category: "technical",
    mode: "individual",
    description:
      "Showcase your visual thinking and create designs that communicate powerful ideas.",
    poster: "DES",
    teamSize: 1,
    rules:
      "Design must be original. Participants must complete the challenge within the given time.",
    eligibility: "Open to all registered college students.",
    prize: "Prizes and certificates",
    enabled: true,
    rounds: [
      {
        id: "designing-r1",
        name: "DESIGN CHALLENGE",
        description: "Create a design based on the problem statement.",
        date: "2026-09-10",
        startTime: "11:00",
        endTime: "12:00",
        venue: "Lab 1",
        mode: "Offline",
      },
    ],
  },
  {
    id: "code-relay",
    name: "CODE RELAY",
    category: "technical",
    mode: "team",
    description:
      "A fast-paced coding challenge where teamwork, logic and speed decide the winner.",
    poster: "CODE",
    teamSize: 4,
    rules:
      "Teams must solve programming challenges within the allotted time.",
    eligibility: "Open to students with programming interest.",
    prize: "Prizes and certificates",
    enabled: true,
    rounds: [
      {
        id: "code-r1",
        name: "QUALIFIER",
        description: "Initial programming challenge.",
        date: "2026-09-10",
        startTime: "11:00",
        endTime: "12:00",
        venue: "Computer Lab",
        mode: "Offline",
      },
      {
        id: "code-r2",
        name: "FINAL",
        description: "Final coding challenge for shortlisted teams.",
        date: "2026-09-10",
        startTime: "15:00",
        endTime: "16:00",
        venue: "Computer Lab",
        mode: "Offline",
      },
    ],
  },
  {
    id: "tech-event-4",
    name: "TECHNICAL EVENT 4",
    category: "technical",
    mode: "individual",
    description:
      "Put your technical knowledge and problem-solving ability to the ultimate test.",
    poster: "TECH",
    teamSize: 1,
    rules: "Follow the instructions given by the event coordinators.",
    eligibility: "Open to college students.",
    prize: "Prizes and certificates",
    enabled: true,
    rounds: [],
  },
  {
    id: "event-1",
    name: "EVENT 1",
    category: "non-technical",
    mode: "individual",
    description:
      "A fun challenge designed to test your presence of mind, creativity and confidence.",
    poster: "01",
    teamSize: 1,
    rules: "Follow the instructions given by the coordinators.",
    eligibility: "Open to all registered participants.",
    prize: "Prizes and certificates",
    enabled: true,
    rounds: [],
  },
  {
    id: "event-2",
    name: "EVENT 2",
    category: "non-technical",
    mode: "team",
    description:
      "Work together, think differently and experience an exciting competitive challenge.",
    poster: "02",
    teamSize: 4,
    rules: "Team members must cooperate throughout the event.",
    eligibility: "Open to college students.",
    prize: "Prizes and certificates",
    enabled: true,
    rounds: [],
  },
  {
    id: "event-3",
    name: "EVENT 3",
    category: "non-technical",
    mode: "individual",
    description:
      "A high-energy challenge where quick thinking and creativity take centre stage.",
    poster: "03",
    teamSize: 1,
    rules: "Participants must follow coordinator instructions.",
    eligibility: "Open to college students.",
    prize: "Prizes and certificates",
    enabled: true,
    rounds: [],
  },
  {
    id: "event-4",
    name: "EVENT 4",
    category: "non-technical",
    mode: "team",
    description:
      "Bring your team together and take on a challenge built for fun and collaboration.",
    poster: "04",
    teamSize: 4,
    rules: "Teamwork and fair play are required.",
    eligibility: "Open to college students.",
    prize: "Prizes and certificates",
    enabled: true,
    rounds: [],
  },
];

const DEFAULT_CONFIG: SiteConfig = {
  heroWelcome: "WELCOME TO",
  heroTitle: "DYNAMOZ",
  heroYear: "26",
  heroTaglineOne: "IGNITE.",
  heroTaglineTwo: "INNOVATE.",
  heroTaglineThree: "INSPIRE.",

  eventDate: "2026-09-21T00:00:00",
  registrationDeadline: "2026-09-10T23:59:59",

  aboutSubtitle: "Where ideas ignite and innovation takes form.",
  aboutLead:
    "DYNAMOZ 26 is a technical symposium built to bring together students, ideas and challenges in one high-energy experience.",
  aboutDescription:
    "From technology-driven competitions to creative non-technical challenges, DYNAMOZ is designed to encourage curiosity, collaboration and innovation.",
  department: "DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING",
  institution: "UNIVERSITY COLLEGE OF ENGINEERING, NAGERCOIL",

  people: [
    {
      id: "person-1",
      role: "HEAD OF DEPARTMENT",
      name: "Dr. K.L. Neela",
      initials: "KN",
      photo: null,
      description:
        "Guiding the department with vision and academic excellence.",
    },
    {
      id: "person-2",
      role: "SYMPOSIUM COORDINATOR",
      name: "Dr. K. Ramesh",
      initials: "KR",
      photo: null,
      description:
        "Orchestrating DYNAMOZ 26 with precision and passion for innovation.",
    },
  ],

  contactDepartment: "COMPUTER SCIENCE AND ENGINEERING",
  contactInstitution:
    "UNIVERSITY COLLEGE OF ENGINEERING, NAGERCOIL",
  contactEmail: "dynamoz26@example.com",
  contactLocation: "NAGERCOIL, TAMIL NADU",

  studentCoordinators: [],

  whatsapp: "",

  registrationEnabled: true,
};

/* =========================================================
   STORAGE
========================================================= */

const EVENTS_KEY = "dynamoz26_events";
const CONFIG_KEY = "dynamoz26_site_config";
const REGISTRATIONS_KEY = "dynamoz26_registrations";
const APP_STATE_TABLE = "app_state";

const getStoredEvents = (): EventItem[] => {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) return DEFAULT_EVENTS;
    const parsed = JSON.parse(raw) as EventItem[];
    return Array.isArray(parsed) ? parsed : DEFAULT_EVENTS;
  } catch {
    return DEFAULT_EVENTS;
  }
};

const saveEvents = (events: EventItem[]) => {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
};

const getStoredConfig = (): SiteConfig => {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const stored = JSON.parse(raw) as Partial<SiteConfig>;
    if (stored.eventDate === "2026-09-10T00:00:00") {
      stored.eventDate = DEFAULT_CONFIG.eventDate;
    }
    if (stored.registrationDeadline === "2026-09-05T23:59:59") {
      stored.registrationDeadline = DEFAULT_CONFIG.registrationDeadline;
    }
    const merged = { ...DEFAULT_CONFIG, ...stored };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return DEFAULT_CONFIG;
  }
};

const saveConfig = (config: SiteConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

const getStoredRegistrations = (): Registration[] => {
  try {
    const raw = localStorage.getItem(REGISTRATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Registration[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeRegisterNumber = (value: string) =>
  value.trim().toLowerCase();

const saveRegistration = async (registration: Registration) => {
  const mainRegisterNumber = normalizeRegisterNumber(registration.student.registerNumber);
  const existing = getStoredRegistrations();
  localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify([
    ...existing.filter((item) => item.id !== registration.id),
    registration,
  ]));

  const batch = writeBatch(db);
  batch.set(doc(db, "registrations", registration.id), {
    ...registration,
    studentRegisterNumber: mainRegisterNumber,
  });

  const participantEvents = new Map<string, Set<string>>();
  const participantNames = new Map<string, string>();
  const addEvent = (registerNumber: string, eventId: string) => {
    if (!participantEvents.has(registerNumber)) participantEvents.set(registerNumber, new Set());
    participantEvents.get(registerNumber)!.add(eventId);
  };

  registration.selectedEvents.forEach((eventId) => addEvent(mainRegisterNumber, eventId));
  participantNames.set(mainRegisterNumber, registration.student.fullName.trim());

  Object.entries(registration.teams).forEach(([eventId, team]) => {
    team.members.forEach((member) => {
      const registerNumber = normalizeRegisterNumber(member.registerNumber);
      if (!registerNumber) return;
      participantNames.set(registerNumber, member.name.trim());
      addEvent(registerNumber, eventId);
    });
  });

  participantEvents.forEach((eventIds, registerNumber) => {
    const registrationId = registration.participantRegistrationIds[registerNumber];
    const registeredEvents: Record<string, unknown> = {};
    eventIds.forEach((eventId) => {
      registeredEvents[eventId] = {
        registrationId,
        registrationSubmissionId: registration.id,
        registeredAt: registration.createdAt,
      };
    });

    batch.set(doc(db, "students", registerNumber), {
      ...(registerNumber === mainRegisterNumber ? registration.student : {}),
      ...(participantNames.get(registerNumber) ? { fullName: participantNames.get(registerNumber) } : {}),
      registerNumber,
      registrationId,
      registeredEvents,
      updatedAt: registration.createdAt,
      createdAt: registration.createdAt,
    }, { merge: true });
  });

  await batch.commit();
};

const EVENT_POSTERS_TABLE = "events";

const attachCloudPosters = async (
  events: EventItem[]
): Promise<EventItem[]> => {
  try {
    const postersSnapshot = await getDocs(
      collection(db, EVENT_POSTERS_TABLE)
    );

    const cloudEvents = new Map<string, EventItem>();
    postersSnapshot.docs.forEach((item) => {
      const data = item.data() as Partial<EventItem>;
      cloudEvents.set(item.id, {
        ...(data as EventItem),
        id: typeof data.id === "string" ? data.id : item.id,
        posterImage:
          typeof data.posterImage === "string"
            ? data.posterImage
            : null,
      });
    });

    return events.map((event) => {
      const cloudEvent = cloudEvents.get(event.id);
      return cloudEvent
        ? { ...event, ...cloudEvent, id: event.id }
        : event;
    });
  } catch (error) {
    console.error("Unable to load event posters from Firebase:", error);
    return events;
  }
};

const fetchCloudAppState = async () => {
  const [eventsSnap, configSnap] = await Promise.all([
    getDoc(doc(db, APP_STATE_TABLE, EVENTS_KEY)),
    getDoc(doc(db, APP_STATE_TABLE, CONFIG_KEY)),
  ]);

  const eventsData = eventsSnap.exists()
    ? eventsSnap.data().value
    : null;
  const configData = configSnap.exists()
    ? configSnap.data().value
    : null;

  const baseEvents = Array.isArray(eventsData)
    ? (eventsData as EventItem[])
    : null;

  return {
    events: baseEvents
      ? await attachCloudPosters(baseEvents)
      : null,
    config:
      configData && typeof configData === "object"
        ? (configData as SiteConfig)
        : null,
  };
};

const saveCloudAppState = async (
  key: string,
  value: unknown
) => {
  // Every event is stored in its own Firestore document. This keeps each
  // poster independent and avoids putting all base64 poster data into one
  // document, which can exceed Firestore's 1 MiB document limit.
  if (key === EVENTS_KEY && Array.isArray(value)) {
    const events = value as EventItem[];

    await Promise.all(
      events.map((event) =>
        setDoc(
          doc(db, EVENT_POSTERS_TABLE, event.id),
          {
            ...event,
            posterImage:
              typeof event.posterImage === "string"
                ? event.posterImage
                : null,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )
      )
    );

    // Keep the existing app_state document as a lightweight ordered index so
    // the rest of the app can continue using the current loading/listener flow.
    // No poster data is stored here.
    const eventMetadata = events.map((event) => {
      const { posterImage: _posterImage, ...metadata } = event;
      return metadata;
    });

    await setDoc(
      doc(db, APP_STATE_TABLE, key),
      {
        key,
        value: eventMetadata,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return;
  }

  await setDoc(
    doc(db, APP_STATE_TABLE, key),
    {
      key,
      value,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
};

const fetchCloudRegistrations = async (): Promise<Registration[]> => {
  const snapshot = await getDocs(
    collection(db, "registrations")
  );

  const registrations = snapshot.docs.map((item) => {
    const data = item.data() as Registration & {
      studentRegisterNumber?: string;
    };

    return {
      id: data.id ?? item.id,
      studentRegistrationId: data.studentRegistrationId ?? data.id ?? item.id,
      student: data.student,
      selectedEvents: Array.isArray(data.selectedEvents)
        ? data.selectedEvents
        : [],
      teams:
        data.teams && typeof data.teams === "object"
          ? data.teams
          : {},
      participantRegistrationIds:
        data.participantRegistrationIds &&
        typeof data.participantRegistrationIds === "object"
          ? data.participantRegistrationIds
          : {},
      createdAt: data.createdAt ?? "",
    } satisfies Registration;
  });

  registrations.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

  return registrations;
};

const generateId = (prefix = "id") =>
  `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

const generateRegistrationId = () =>
  `reg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const downloadCSV = (filename: string, rows: string[][]) => {
  const csv = rows
    .map((row) =>
      row
        .map((value) =>
          `"${String(value).replace(/"/g, '""')}"`
        )
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
};

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (dateString: string) => {
  if (!dateString) return "TBA";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isRegistrationDeadlinePassed = (deadline: string) => {
  if (!deadline) return false;

  const time = new Date(deadline).getTime();

  if (Number.isNaN(time)) return false;

  return Date.now() > time;
};

/* =========================================================
   NAVBAR
========================================================= */

function Navbar({
  onSection,
  onRegister,
  config,
}: {
  onSection: (section: Section) => void;
  onRegister: () => void;
  config: SiteConfig;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems: { label: string; section: Section }[] = [
    { label: "HOME", section: "home" },
    { label: "EVENTS", section: "events" },
    { label: "ABOUT", section: "about" },
    { label: "TEAM", section: "team" },
    { label: "CONTACT", section: "contact" },
  ];

  const handleNavigation = (section: Section) => {
    onSection(section);
    setMenuOpen(false);
  };

  const registrationAvailable =
    config.registrationEnabled &&
    !isRegistrationDeadlinePassed(config.registrationDeadline);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <button
          className="brand"
          onClick={() => handleNavigation("home")}
          aria-label="DYNAMOZ Home"
        >
          <img
            src={DEmblem}
            alt="DYNAMOZ emblem"
            className="brand-emblem"
          />

          <span className="brand-word">{config.heroTitle}</span>

          <span className="brand-year">{config.heroYear}</span>
        </button>

        <nav
          className={`desktop-nav ${menuOpen ? "mobile-open" : ""
            }`}
        >
          {navItems.map((item) => (
            <button
              key={item.section}
              className="nav-link"
              onClick={() => handleNavigation(item.section)}
            >
              {item.label}
            </button>
          ))}

          <button
            className="mobile-register"
            disabled={!registrationAvailable}
            onClick={() => {
              setMenuOpen(false);
              onRegister();
            }}
          >
            {registrationAvailable
              ? "REGISTER NOW"
              : "REGISTRATION CLOSED"}{" "}
            <span>↗</span>
          </button>
        </nav>

        <button
          className="nav-register"
          disabled={!registrationAvailable}
          onClick={onRegister}
        >
          {registrationAvailable
            ? "REGISTER NOW"
            : "REGISTRATION CLOSED"}{" "}
          <span>↗</span>
        </button>

        <button
          className={`hamburger ${menuOpen ? "active" : ""
            }`}
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}

/* =========================================================
   SOCIAL RAIL
========================================================= */

function SocialRail({
  config,
}: {
  config: SiteConfig;
}) {
  const whatsapp = config.whatsapp?.trim();
  if (!whatsapp) return null;

  return (
    <div className="social-rail">
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
      >
        ☏
      </a>
    </div>
  );
}

/* =========================================================
   HERO
========================================================= */

function HeroSection({
  onRegister,
  onEvents,
  config,
}: {
  onRegister: () => void;
  onEvents: () => void;
  config: SiteConfig;
}) {
  const [typedText, setTypedText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const typingPhrases = [
    "Ignite.",
    "Innovate.",
    "Inspire.",
  ];

  const [countdown, setCountdown] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    const phrase = typingPhrases[typingIndex];
    const finishedTyping = !isDeleting && typedText === phrase;
    const finishedDeleting = isDeleting && typedText === "";

    const delay = finishedTyping
      ? 1100
      : isDeleting
        ? 65
        : 125;

    const timer = window.setTimeout(() => {
      if (finishedTyping) {
        setIsDeleting(true);
        return;
      }

      if (finishedDeleting) {
        setIsDeleting(false);
        setTypingIndex(
          (typingIndex + 1) % typingPhrases.length
        );
        return;
      }

      if (isDeleting) {
        setTypedText(typedText.slice(0, -1));
      } else {
        setTypedText(phrase.slice(0, typedText.length + 1));
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [typedText, typingIndex, isDeleting]);

  useEffect(() => {
    const target = new Date(
      config.eventDate
    ).getTime();

    const updateCountdown = () => {
      const distance = Math.max(0, target - Date.now());

      const days = Math.floor(
        distance / (1000 * 60 * 60 * 24)
      );

      const hours = Math.floor(
        (distance / (1000 * 60 * 60)) % 24
      );

      const minutes = Math.floor(
        (distance / (1000 * 60)) % 60
      );

      const seconds = Math.floor(
        (distance / 1000) % 60
      );

      setCountdown({
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    };

    updateCountdown();

    const timer = window.setInterval(
      updateCountdown,
      1000
    );

    return () => window.clearInterval(timer);
  }, [config.eventDate]);

  const registrationAvailable =
    config.registrationEnabled &&
    !isRegistrationDeadlinePassed(
      config.registrationDeadline
    );

  return (
    <section id="home" className="hero">
      <div className="hero-noise" />

      <div className="hero-glow hero-glow-one" />
      <div className="hero-glow hero-glow-two" />

      <div className="hero-content">
        <div className="hero-kicker">
          <span />
          {config.heroWelcome}
        </div>

        <h1 className="hero-title">
          <span>{config.heroTitle}</span>
          <strong>{config.heroYear}</strong>
        </h1>

        <div className="hero-presented-by" aria-label="Presented by Galaxie, the technical association">
          <span>PRESENTED BY</span>
          <strong>GALACXIE</strong>
          <em>THE TECHNICAL ASSOCIATION</em>
        </div>

        {(config.institution?.trim() || config.department?.trim()) && (
          <div className="hero-institution">
            {config.institution?.trim() && <strong>{config.institution}</strong>}
            {config.department?.trim() && <span>{config.department}</span>}
          </div>
        )}

        <div className="hero-divider" />

        <div className="hero-tagline">
          <span className="red">
            {config.heroTaglineOne}
          </span>

          <span className="orange">
            {config.heroTaglineTwo}
          </span>

          <span>{config.heroTaglineThree}</span>
        </div>

        <div className="typing-line">
          {typedText}
          <span className="typing-cursor" />
        </div>

        <div className="hero-buttons">
          <button
            className="primary-button"
            onClick={onEvents}
          >
            EXPLORE EVENTS
            <span>↗</span>
          </button>

          <button
            className="outline-button"
            disabled={!registrationAvailable}
            onClick={onRegister}
          >
            {registrationAvailable
              ? "REGISTER NOW"
              : "REGISTRATION CLOSED"}
            <span>↗</span>
          </button>
        </div>

        <div className="countdown-block">
          <div className="countdown-label">
            EVENT COUNTDOWN
            <span />
          </div>

          <div className="countdown-box">
            <CountdownUnit
              value={countdown.days}
              label="DAYS"
            />

            <CountdownUnit
              value={countdown.hours}
              label="HOURS"
            />

            <CountdownUnit
              value={countdown.minutes}
              label="MINUTES"
            />

            <CountdownUnit
              value={countdown.seconds}
              label="SECONDS"
            />
          </div>

          <div className="hero-dates">
            <div className="hero-date-item">
              <span>EVENT DATE</span>
              <strong>{formatDate(config.eventDate)}</strong>
            </div>

            <div className="hero-date-item deadline">
              <span>REGISTRATION DEADLINE</span>
              <strong>{formatDate(config.registrationDeadline)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-emblem-wrap">
        <div className="emblem-aura" />
        <div className="emblem-ring ring-one" />
        <div className="emblem-ring ring-two" />

        <div className="emblem-platform">
          <div className="platform-line" />
          <div className="platform-line second" />
        </div>

        <img
          src={DEmblem}
          alt="DYNAMOZ emblem"
          className="hero-emblem"
        />

        <div className="emblem-particles">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>

      <div className="hero-values">
        <ValueItem
          icon="♨"
          title="IGNITE"
        />

        <ValueItem
          icon="♧"
          title="INNOVATE"
        />

        <ValueItem
          icon="✦"
          title="INSPIRE"
          light
        />
      </div>

      <div className="hero-scroll">
        <span>SCROLL TO EXPLORE</span>
        <i />
      </div>
    </section>
  );
}

function CountdownUnit({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="countdown-unit">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ValueItem({
  icon,
  title,
  light,
}: {
  icon: string;
  title: string;
  light?: boolean;
}) {
  return (
    <div
      className={`value-item ${light ? "light" : ""
        }`}
    >
      <span className="value-icon">{icon}</span>
      <span>{title}</span>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="section-heading">
      <div className="section-number">
        {number} / <span>{title}</span>
      </div>

      <h2>{title}</h2>

      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

/* =========================================================
   EVENTS
========================================================= */

function EventsSection({
  onRegister,
  events,
}: {
  onRegister: (eventId?: string) => void;
  events: EventItem[];
}) {
  const [filter, setFilter] = useState<
    "all" | "technical" | "non-technical"
  >("all");

  const [selectedEvent, setSelectedEvent] =
    useState<EventItem | null>(null);

  const visibleEvents = events.filter(
    (event) => event.enabled
  );

  const filteredEvents = useMemo(() => {
    if (filter === "all") return visibleEvents;

    return visibleEvents.filter(
      (event) => event.category === filter
    );
  }, [filter, events]);

  return (
    <section
      id="events"
      className="section events-section"
    >
      <div className="section-container">
        <SectionHeader
          number="03"
          title="THE EVENTS"
          subtitle="Choose your challenge. Make your mark."
        />

        <div className="event-filter">
          {(
            [
              "all",
              "technical",
              "non-technical",
            ] as const
          ).map((item) => (
            <button
              key={item}
              className={
                filter === item ? "active" : ""
              }
              onClick={() => setFilter(item)}
            >
              {item === "all"
                ? "ALL"
                : item === "technical"
                  ? "TECHNICAL"
                  : "NON-TECHNICAL"}
            </button>
          ))}
        </div>

        <div className="events-grid">
          {filteredEvents.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              index={index}
              onView={() =>
                setSelectedEvent(event)
              }
            />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="empty-admin">
            NO EVENTS AVAILABLE
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() =>
            setSelectedEvent(null)
          }
          onRegister={() => {
            setSelectedEvent(null);
            onRegister(selectedEvent.id);
          }}
        />
      )}
    </section>
  );
}

function EventCard({
  event,
  index,
  onView,
}: {
  event: EventItem;
  index: number;
  onView: () => void;
}) {
  return (
    <article
      className="event-card"
      style={{
        animationDelay: `${index * 70}ms`,
      }}
    >
      <div className={`event-poster ${event.posterImage ? "has-poster-image" : ""}`}>
        {event.posterImage ? (
          <img
            src={event.posterImage}
            alt={`${event.name} poster`}
            className="event-poster-image"
          />
        ) : (
          <>
            <div className="poster-grid" />
            <span className="poster-watermark">
              {event.poster}
            </span>
          </>
        )}

        <div className="event-badges">
          <span className="event-badge">
            {event.category === "technical"
              ? "TECHNICAL"
              : "NON-TECHNICAL"}
          </span>

          <span className="event-badge mode">
            {event.mode === "team"
              ? `TEAM · ${event.teamSize}`
              : "INDIVIDUAL"}
          </span>
        </div>

        <div className="poster-number">
          {(index + 1)
            .toString()
            .padStart(2, "0")}
        </div>
      </div>

      <div className="event-content">
        <div className="event-small-label">
          {event.mode === "team"
            ? "TEAM EVENT"
            : "INDIVIDUAL EVENT"}
        </div>

        <h3>{event.name}</h3>

        {event.description?.trim() && <p>{event.description}</p>}

        <button
          className="event-view"
          onClick={onView}
        >
          VIEW DETAILS
          <span>↗</span>
        </button>
      </div>
    </article>
  );
}

/* =========================================================
   EVENT MODAL
========================================================= */

function EventModal({
  event,
  onClose,
  onRegister,
}: {
  event: EventItem;
  onClose: () => void;
  onRegister: () => void;
}) {
  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="event-modal"
        onClick={(eventClick) =>
          eventClick.stopPropagation()
        }
      >
        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className={`modal-poster ${event.posterImage ? "has-poster-image" : ""}`}>
          {event.posterImage ? (
            <img src={event.posterImage} alt={`${event.name} poster`} />
          ) : (
            <span>{event.poster}</span>
          )}
        </div>

        <div className="modal-content">
          <div className="event-small-label">
            {event.category === "technical"
              ? "TECHNICAL EVENT"
              : "NON-TECHNICAL EVENT"}
          </div>

          <h2>{event.name}</h2>

          {event.description?.trim() && <p>{event.description}</p>}

          {event.theme?.trim() && (
            <div className="event-modal-block">
              <span>THEME</span>
              <p>{event.theme}</p>
            </div>
          )}

          {event.detailedDescription?.trim() && (
            <div className="event-modal-block">
              <span>ABOUT THE EVENT</span>
              <p>{event.detailedDescription}</p>
            </div>
          )}

          <div className="modal-info">
            <div>
              <span>FORMAT</span>
              <strong>
                {event.mode === "team"
                  ? `TEAM · UP TO ${event.teamSize} MEMBERS`
                  : event.mode === "individual-or-team"
                    ? "INDIVIDUAL OR TEAM"
                    : "INDIVIDUAL"}
              </strong>
            </div>

            {event.prize?.trim() && (
              <div>
                <span>PRIZES</span>
                <strong>{event.prize}</strong>
              </div>
            )}

            {event.eligibility?.trim() && (
              <div>
                <span>ELIGIBILITY</span>
                <strong>{event.eligibility}</strong>
              </div>
            )}
          </div>

          {event.rules?.trim() && (
            <div className="event-modal-block">
              <span>GUIDELINES</span>
              <p>{event.rules}</p>
            </div>
          )}

          {event.whatsappLink?.trim() && (
            <a
              className="whatsapp-event-button"
              href={event.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              JOIN WHATSAPP GROUP
              <span>↗</span>
            </a>
          )}

          {event.rounds.length > 0 && (
            <div className="event-rounds">
              <div className="event-rounds-title">
                EVENT ROUNDS
              </div>

              {event.rounds.map(
                (round, index) => (
                  <div
                    className="event-round"
                    key={round.id}
                  >
                    <div className="event-round-number">
                      {(index + 1)
                        .toString()
                        .padStart(2, "0")}
                    </div>

                    <div>
                      <strong>
                        {round.name}
                      </strong>

                      <p>
                        {round.description}
                      </p>

                      <small>
                        {formatDate(round.date)} ·{" "}
                        {round.startTime} -{" "}
                        {round.endTime} ·{" "}
                        {round.venue} ·{" "}
                        {round.mode}
                      </small>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <button
            className="primary-button full"
            onClick={onRegister}
          >
            REGISTER FOR THIS EVENT
            <span>↗</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ABOUT
========================================================= */

function AboutSection({
  config,
}: {
  config: SiteConfig;
}) {
  return (
    <section
      id="about"
      className="section about-section"
    >
      <div className="section-container about-layout">
        <div>
          <SectionHeader
            number="04"
            title="ABOUT DYNAMOZ"
            subtitle={config.aboutSubtitle}
          />
        </div>

        <div className="about-copy">
          <div className="about-big-number">
            {config.heroYear}
          </div>

          <p className="about-lead">
            {config.aboutLead}
          </p>

          <p>{config.aboutDescription}</p>

          <div className="about-location">
            <span>ORGANISED BY</span>

            <strong>
              {config.department}
            </strong>

            <strong>
              {config.institution}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   PEOPLE
========================================================= */

function PeopleSection({
  config,
}: {
  config: SiteConfig;
}) {
  return (
    <section
      id="team"
      className="section team-section"
    >
      <div className="section-container">
        <SectionHeader
          number="05"
          title="THE PEOPLE"
          subtitle="The people behind DYNAMOZ 26."
        />

        <div className="people-grid">
          {config.people.map((person) => (
            <article
              className="person-card"
              key={person.id}
            >
              <div className="person-top-line" />

              <div className="person-initials">
                {person.photo ? (
                  <img
                    src={person.photo}
                    alt={person.name}
                    className="person-photo"
                    loading="lazy"
                  />
                ) : (
                  person.initials
                )}
              </div>

              <div className="person-role">
                {person.role}
              </div>

              <h3>{person.name}</h3>

              <p>{person.description}</p>

              <div className="person-watermark">
                {person.initials}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   CONTACT
========================================================= */

function ContactSection({
  config,
}: {
  config: SiteConfig;
}) {
  return (
    <section
      id="contact"
      className="section contact-section"
    >
      <div className="section-container contact-layout">
        <div>
          <SectionHeader
            number="06"
            title="CONTACT"
            subtitle="Have a question? Reach out to the DYNAMOZ team."
          />
        </div>

        <div className="contact-card">
          <div className="contact-row">
            <span>DEPARTMENT</span>
            <strong>
              {config.contactDepartment}
            </strong>
          </div>

          <div className="contact-row">
            <span>INSTITUTION</span>
            <strong>
              {config.contactInstitution}
            </strong>
          </div>

          {config.contactEmail?.trim() && (
            <div className="contact-row">
              <span>EMAIL</span>
              <strong>
                <a href={`mailto:${config.contactEmail.trim()}`}>
                  {config.contactEmail.trim()}
                </a>
              </strong>
            </div>
          )}

          <div className="contact-row">
            <span>LOCATION</span>
            <strong>
              {config.contactLocation}
            </strong>
          </div>
        </div>

        {(config.studentCoordinators ?? []).filter(
          (coordinator) =>
            coordinator.name?.trim() &&
            coordinator.phone?.trim()
        ).length > 0 && (
          <div className="contact-card student-coordinators-card">
            <div className="student-coordinators-title">
              STUDENT COORDINATORS
            </div>

            {(config.studentCoordinators ?? [])
              .filter(
                (coordinator) =>
                  coordinator.name?.trim() &&
                  coordinator.phone?.trim()
              )
              .map((coordinator, index) => (
                <div
                  className="contact-row student-coordinator-row"
                  key={`${coordinator.name}-${coordinator.phone}-${index}`}
                >
                  <strong>{coordinator.name.trim()}</strong>
                  <a href={`tel:${coordinator.phone.trim()}`}>
                    {coordinator.phone.trim()}
                  </a>
                </div>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   FOOTER
========================================================= */

function Footer({
  config,
}: {
  config: SiteConfig;
}) {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <img
          src={DEmblem}
          alt="DYNAMOZ"
        />

        <div>
          <strong>
            {config.heroTitle}{" "}
            <span>{config.heroYear}</span>
          </strong>

          <small>
            {config.heroTaglineOne}{" "}
            {config.heroTaglineTwo}{" "}
            {config.heroTaglineThree}
          </small>
        </div>
      </div>

      <div className="footer-middle">
        {config.department}
        <br />
        {config.institution}
      </div>

      <div className="footer-copy">
        © 2026 DYNAMOZ. ALL RIGHTS RESERVED.
      </div>
    </footer>
  );
}

/* =========================================================
   REGISTRATION
========================================================= */

function RegistrationPage({
  onBackHome,
  events,
  config,
  initialEventId,
}: {
  onBackHome: () => void;
  events: EventItem[];
  config: SiteConfig;
  initialEventId?: string;
}) {
  const [step, setStep] = useState(1);

  const [student, setStudent] =
    useState<StudentDetails>({
      fullName: "",
      registerNumber: "",
      department:
        "Computer Science and Engineering",
      year: "",
      email: "",
      phone: "",
    });

  const [selectedEvents, setSelectedEvents] =
    useState<string[]>(
      initialEventId ? [initialEventId] : []
    );

  const [participationModes, setParticipationModes] = useState<
    Record<string, "individual" | "team">
  >({});

  const [teams, setTeams] = useState<
    Record<string, TeamDetails>
  >({});

  const [submittedRegistration, setSubmittedRegistration] =
    useState<Registration | null>(null);

  const activeEvents = events.filter(
    (event) => event.enabled
  );

  const teamEvents = selectedEvents
    .map((id) =>
      activeEvents.find(
        (event) => event.id === id
      )
    )
    .filter(
      (event): event is EventItem =>
        Boolean(
          event &&
            (event.mode === "team" ||
              (event.mode === "individual-or-team" &&
                participationModes[event.id] === "team"))
        )
    );

  const updateStudent = (
    field: keyof StudentDetails,
    value: string
  ) => {
    setStudent((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // Keep the registering student permanently synced as Team Member 01
  // in the actual team state (not only in the UI).
  useEffect(() => {
    if (teamEvents.length === 0) return;

    setTeams((current) => {
      let changed = false;
      const next = { ...current };

      for (const event of teamEvents) {
        const teamSize = event.teamSize || 4;
        const existing = next[event.id];

        const members = Array.from(
          { length: teamSize },
          (_, index) => {
            if (index === 0) {
              return {
                name: student.fullName,
                registerNumber: student.registerNumber,
              };
            }

            return existing?.members?.[index] ?? {
              name: "",
              registerNumber: "",
            };
          }
        );

        const nextTeam = {
          teamName: existing?.teamName ?? "",
          members,
        };

        const previous = existing;
        if (
          !previous ||
          previous.teamName !== nextTeam.teamName ||
          previous.members.length !== nextTeam.members.length ||
          previous.members.some(
            (member, index) =>
              member.name !== nextTeam.members[index].name ||
              member.registerNumber !==
                nextTeam.members[index].registerNumber
          )
        ) {
          next[event.id] = nextTeam;
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [
    student.fullName,
    student.registerNumber,
    selectedEvents.join("|"),
    events,
  ]);

  useEffect(() => {
    const registerNumber = student.registerNumber.trim();
    if (!registerNumber) return;

    const normalized = normalizeRegisterNumber(registerNumber);

    const timer = window.setTimeout(async () => {
      try {
        const studentSnap = await getDoc(
          doc(db, "students", normalized)
        );

        if (!studentSnap.exists()) return;

        const data = studentSnap.data() as StudentDetails;

        setStudent((current) => {
          if (
            normalizeRegisterNumber(current.registerNumber) !==
            normalized
          ) {
            return current;
          }

          return {
            fullName: data.fullName ?? current.fullName,
            registerNumber: data.registerNumber ?? current.registerNumber,
            department: data.department ?? current.department,
            year: data.year ?? current.year,
            email: data.email ?? current.email,
            phone: data.phone ?? current.phone,
          };
        });
      } catch (error) {
        console.error("Student lookup failed:", error);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [student.registerNumber]);

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((current) => {
      if (current.includes(eventId)) {
        const next = current.filter(
          (id) => id !== eventId
        );

        setTeams((existing) => {
          const copy = { ...existing };
          delete copy[eventId];
          return copy;
        });

        setParticipationModes((modes) => {
          const nextModes = { ...modes };
          delete nextModes[eventId];
          return nextModes;
        });

        return next;
      }

      const event = activeEvents.find((item) => item.id === eventId);
      if (event?.mode === "individual-or-team") {
        setParticipationModes((modes) => ({ ...modes, [eventId]: modes[eventId] ?? "individual" }));
      }

      return [...current, eventId];
    });
  };

  const setParticipationMode = (eventId: string, mode: "individual" | "team") => {
    setParticipationModes((current) => ({ ...current, [eventId]: mode }));
    if (mode === "individual") {
      setTeams((current) => {
        const next = { ...current };
        delete next[eventId];
        return next;
      });
    }
  };

  const updateTeamName = (
    eventId: string,
    teamName: string
  ) => {
    const event = events.find(
      (item) => item.id === eventId
    );

    const teamSize = event?.teamSize || 4;

    setTeams((current) => ({
      ...current,
      [eventId]: {
        teamName,
        members:
          current[eventId]?.members ??
          Array.from(
            { length: teamSize },
            (_, index) => ({
              name:
                index === 0
                  ? student.fullName
                  : "",
              registerNumber:
                index === 0
                  ? student.registerNumber
                  : "",
            })
          ),
      },
    }));
  };

  const updateTeamMember = (
    eventId: string,
    index: number,
    field: keyof TeamMember,
    value: string
  ) => {
    setTeams((current) => {
      const event = events.find(
        (item) => item.id === eventId
      );

      const teamSize = event?.teamSize || 4;

      const existing =
        current[eventId] ?? {
          teamName: "",
          members: Array.from(
            { length: teamSize },
            (_, memberIndex) => ({
              name:
                memberIndex === 0
                  ? student.fullName
                  : "",
              registerNumber:
                memberIndex === 0
                  ? student.registerNumber
                  : "",
            })
          ),
        };

      const members = [
        ...existing.members,
      ];

      members[index] = {
        ...members[index],
        [field]: value,
      };

      return {
        ...current,
        [eventId]: {
          ...existing,
          members,
        },
      };
    });
  };

  const validateStepOne = () => {
    if (
      !student.fullName.trim() ||
      !student.registerNumber.trim() ||
      !student.department.trim() ||
      !student.year ||
      !student.email.trim() ||
      !student.phone.trim()
    ) {
      alert(
        "Please complete all student details."
      );

      return false;
    }

    return true;
  };

  const validateStepTwo = () => {
    if (selectedEvents.length === 0) {
      alert(
        "Please select at least one event."
      );

      return false;
    }

    return true;
  };

  const validateStepThree = () => {
    for (const event of teamEvents) {
      const team = teams[event.id];

      if (!team?.teamName.trim()) {
        alert(
          `Please enter the team name for ${event.name}.`
        );

        return false;
      }

      const maxMembers = event.teamSize || 4;

      // Member 01 is always the registering student.
      if (
        !student.fullName.trim() ||
        !student.registerNumber.trim()
      ) {
        alert(
          `Please complete all team members for ${event.name}.`
        );

        return false;
      }

      // Team size is treated as a maximum. Example: if an event allows
      // 3 members, a team with 2 members is also valid.
      // Empty trailing member slots are allowed, but a partially filled
      // member (only name or only register number) is not allowed.
      const otherMembers = Array.from(
        { length: Math.max(0, maxMembers - 1) },
        (_, offset) =>
          team.members[offset + 1] ?? {
            name: "",
            registerNumber: "",
          }
      );

      const completeOtherMembers = otherMembers.filter((member) => {
        const hasName = member.name.trim().length > 0;
        const hasRegisterNumber =
          member.registerNumber.trim().length > 0;

        return hasName && hasRegisterNumber;
      });

      const hasPartialMember = otherMembers.some((member) => {
        const hasName = member.name.trim().length > 0;
        const hasRegisterNumber =
          member.registerNumber.trim().length > 0;

        return hasName !== hasRegisterNumber;
      });

      if (hasPartialMember) {
        alert(
          `Please complete the name and register number for every added team member in ${event.name}.`
        );

        return false;
      }

      // Minimum team size = 2 members:
      // Member 01 is the registering student + at least one additional member.
      if (completeOtherMembers.length < 1) {
        alert(
          `At least 2 team members are required for ${event.name}.`
        );

        return false;
      }
    }

    return true;
  };

  const handleContinue = () => {
    if (step === 1) {
      if (validateStepOne()) {
        setStep(2);
      }

      return;
    }

    if (step === 2) {
      if (validateStepTwo()) {
        if (teamEvents.length > 0) {
          setStep(3);
        } else {
          setStep(4);
        }
      }

      return;
    }

    if (step === 3) {
      if (validateStepThree()) {
        setStep(4);
      }
    }
  };

  const handleBack = () => {
    if (step === 1) {
      onBackHome();
      return;
    }

    if (
      step === 4 &&
      teamEvents.length === 0
    ) {
      setStep(2);
      return;
    }

    setStep((current) => current - 1);
  };

  const checkExistingStudent = async (registerNumber: string) => {
    const value = normalizeRegisterNumber(registerNumber);
    if (!value) return;

    try {
      const snapshot = await getDoc(
        doc(db, "students", value)
      );

      if (!snapshot.exists()) return;

      const data = snapshot.data() as StudentDetails;

      setStudent({
        fullName: data.fullName ?? "",
        registerNumber: data.registerNumber ?? registerNumber.trim(),
        department: data.department ?? "",
        year: data.year ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
      });
    } catch (error) {
      console.error("Student lookup failed:", error);
    }
  };

  const handleSubmit = async () => {
    if (!config.registrationEnabled || isRegistrationDeadlinePassed(config.registrationDeadline)) {
      alert("Registration deadline has passed.");
      return;
    }
    if (!student.registerNumber.trim() || !student.fullName.trim()) {
      alert("Please complete your student details.");
      return;
    }
    if (selectedEvents.length === 0) {
      alert("Please select at least one event.");
      return;
    }

    try {
      const mainRegisterNumber = normalizeRegisterNumber(student.registerNumber);
      const participantEvents = new Map<string, Set<string>>();
      const participantNames = new Map<string, string>();

      const addParticipantEvent = (registerNumber: string, name: string, eventId: string) => {
        const normalized = normalizeRegisterNumber(registerNumber);
        if (!normalized) return;
        if (!participantEvents.has(normalized)) participantEvents.set(normalized, new Set());
        participantEvents.get(normalized)!.add(eventId);
        if (name.trim()) participantNames.set(normalized, name.trim());
      };

      selectedEvents.forEach((eventId) =>
        addParticipantEvent(mainRegisterNumber, student.fullName, eventId)
      );

      for (const event of teamEvents) {
        const team = teams[event.id];
        const memberNumbers: string[] = [];

        for (const member of team?.members ?? []) {
          const name = member.name.trim();
          const number = normalizeRegisterNumber(member.registerNumber);

          // Empty optional slots are allowed.
          if (!name && !number) {
            continue;
          }

          // If a member is added, both name and register number must be present.
          if (!name || !number) {
            alert(
              `Please complete the name and register number for every added team member in ${event.name}.`
            );
            return;
          }

          // The main registrant can appear in the team members list.
          // They are already registered for this team event through selectedEvents,
          // so do not treat them as a duplicate participant and do not create a new student.
          if (number === mainRegisterNumber) {
            continue;
          }

          memberNumbers.push(number);
          addParticipantEvent(number, name, event.id);
        }

        if (new Set(memberNumbers).size !== memberNumbers.length) {
          alert(`A team member is entered more than once for ${event.name}.`);
          return;
        }
      }

      const entries = await Promise.all(
        Array.from(participantEvents.keys()).map(async (registerNumber) => {
          const snapshot = await getDoc(doc(db, "students", registerNumber));
          return [registerNumber, snapshot] as const;
        })
      );
      const studentSnapshots = new Map(entries);

      // Same student + same event is blocked, but other events are allowed.
      for (const [registerNumber, eventIds] of participantEvents.entries()) {
        const snapshot = studentSnapshots.get(registerNumber);
        if (!snapshot?.exists()) continue;
        const data = snapshot.data() as {
          fullName?: string; registerNumber?: string;
          registeredEvents?: Record<string, unknown>;
        };
        const duplicates = Array.from(eventIds).filter(
          (eventId) => Boolean(data.registeredEvents?.[eventId])
        );
        if (duplicates.length) {
          const eventNames = duplicates.map((eventId) =>
            events.find((event) => event.id === eventId)?.name ?? eventId
          ).join(", ");
          alert(`${data.fullName || participantNames.get(registerNumber) || registerNumber} (${data.registerNumber || registerNumber}) is already registered for: ${eventNames}`);
          return;
        }
      }

      const mainSnapshot = studentSnapshots.get(mainRegisterNumber);
      let currentStudent = student;
      let mainStudentRegistrationId = "";
      if (mainSnapshot?.exists()) {
        const data = mainSnapshot.data() as StudentDetails & { registrationId?: string };
        currentStudent = {
          fullName: data.fullName ?? student.fullName,
          registerNumber: data.registerNumber ?? student.registerNumber.trim(),
          department: data.department ?? student.department,
          year: data.year ?? student.year,
          email: data.email ?? student.email,
          phone: data.phone ?? student.phone,
        };
        mainStudentRegistrationId = data.registrationId ?? "";
        setStudent(currentStudent);
      }
      if (!mainStudentRegistrationId) mainStudentRegistrationId = generateRegistrationId();

      // One permanent ID per student for the whole DYNAMOZ session.
      const participantRegistrationIds: Record<string, string> = {
        [mainRegisterNumber]: mainStudentRegistrationId,
      };
      for (const [registerNumber, snapshot] of studentSnapshots.entries()) {
        if (registerNumber === mainRegisterNumber) continue;
        const data = snapshot.exists()
          ? (snapshot.data() as { registrationId?: string })
          : null;
        participantRegistrationIds[registerNumber] =
          data?.registrationId || generateRegistrationId();
      }

      const registration: Registration = {
        id: generateId("registration"),
        studentRegistrationId: mainStudentRegistrationId,
        student: currentStudent,
        selectedEvents,
        teams,
        participantRegistrationIds,
        createdAt: new Date().toISOString(),
      };

      await saveRegistration(registration);
      setSubmittedRegistration(registration);
      setStep(5);
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed. Please check your internet connection and try again.");
    }
  };

  if (submittedRegistration) {
    return (
      <div className="registration-page success-page">
        <div className="success-orb" />

        <div className="success-card">
          <div className="success-icon">
            ✓
          </div>

          <div className="registration-kicker">
            DYNAMOZ 26 / CONFIRMATION
          </div>

          <h1>
            REGISTRATION
            <br />
            <span>SUCCESSFUL</span>
          </h1>

          <p>
            Your registration has been successfully
            recorded. We look forward to seeing you
            at DYNAMOZ 26.
          </p>

          <p className="success-followup">
            Stay connected with us for announcements, event updates and
            important information.
          </p>

          {config.whatsapp?.trim() && (
  <a
    className="success-whatsapp-card"
    href={config.whatsapp}
    target="_blank"
    rel="noopener noreferrer"
  >
    <div className="success-whatsapp-icon">
      💬
    </div>

    <div className="success-whatsapp-content">
      <strong>JOIN WHATSAPP GROUP</strong>
      <span>Get updates & important announcements</span>
    </div>

    <div className="success-whatsapp-arrow">
      →
    </div>
  </a>
)}

          <button
            className="outline-button full"
            onClick={onBackHome}
          >
            BACK TO HOME
            <span>↗</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-page">
      <div className="registration-bg-grid" />

      <div className="registration-header">
        <button
          className="registration-logo"
          onClick={onBackHome}
        >
          <img
            src={DEmblem}
            alt="DYNAMOZ"
          />

          <span>
            {config.heroTitle}{" "}
            <b>{config.heroYear}</b>
          </span>
        </button>

        <div className="registration-header-text">
          {config.department}
          <br />
          {config.institution}
        </div>
      </div>

      <div className="registration-container">
        <div className="registration-top">
          <div>
            <div className="registration-kicker">
              DYNAMOZ 26 / REGISTRATION
            </div>

            <h1>
              REGISTER FOR{" "}
              <span>
                {config.heroTitle}
              </span>
            </h1>
          </div>

          <div className="step-counter">
            STEP {step} / 5
          </div>
        </div>

        <RegistrationProgress step={step} />

        <div className="registration-card">
          {step === 1 && (
            <StudentStep
              student={student}
              updateStudent={updateStudent}
              onRegisterNumberBlur={checkExistingStudent}
            />
          )}

          {step === 2 && (
            <EventSelectionStep
              events={activeEvents}
              selectedEvents={selectedEvents}
              participationModes={participationModes}
              toggleEvent={toggleEvent}
              setParticipationMode={setParticipationMode}
            />
          )}

          {step === 3 && (
            <TeamDetailsStep
              teamEvents={teamEvents}
              teams={teams}
              student={student}
              updateTeamName={
                updateTeamName
              }
              updateTeamMember={
                updateTeamMember
              }
            />
          )}

          {step === 4 && (
            <ReviewStep
              events={events}
              student={student}
              selectedEvents={
                selectedEvents
              }
              teams={teams}
              onEditStep={setStep}
            />
          )}

          <div className="registration-actions">
            <button
              className="back-button"
              onClick={handleBack}
            >
              ← BACK
            </button>

            {step < 4 ? (
              <button
                className="primary-button"
                onClick={
                  handleContinue
                }
              >
                CONTINUE
                <span>→</span>
              </button>
            ) : (
              <button
                className="primary-button"
                onClick={handleSubmit}
              >
                CONFIRM REGISTRATION
                <span>↗</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   REGISTRATION PROGRESS
========================================================= */

function RegistrationProgress({
  step,
}: {
  step: number;
}) {
  const labels = [
    "STUDENT",
    "EVENTS",
    "TEAM",
    "REVIEW",
    "DONE",
  ];

  return (
    <div className="registration-progress">
      {labels.map((label, index) => {
        const number = index + 1;

        return (
          <React.Fragment key={label}>
            <div
              className={`progress-step ${number <= step
                  ? "active"
                  : ""
                }`}
            >
              <span>
                {number
                  .toString()
                  .padStart(2, "0")}
              </span>

              <small>{label}</small>
            </div>

            {index <
              labels.length - 1 && (
                <div
                  className={`progress-line ${number < step
                      ? "active"
                      : ""
                    }`}
                />
              )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* =========================================================
   STEP 1
========================================================= */

function StudentStep({
  student,
  updateStudent,
  onRegisterNumberBlur,
}: {
  student: StudentDetails;
  updateStudent: (
    field: keyof StudentDetails,
    value: string
  ) => void;
  onRegisterNumberBlur: (registerNumber: string) => void;
}) {
  return (
    <div className="form-step">
      <div className="form-heading">
        <div className="form-step-number">
          01
        </div>

        <div>
          <h2>
            STUDENT DETAILS
          </h2>

          <p>
            Enter your details to begin
            your registration.
          </p>
        </div>
      </div>

      <div className="form-grid">
        <FormField
          label="FULL NAME"
          value={student.fullName}
          onChange={(value) =>
            updateStudent(
              "fullName",
              value
            )
          }
          placeholder="Enter your full name"
        />

        <FormField
          label="REGISTER NUMBER"
          value={
            student.registerNumber
          }
          onChange={(value) =>
            updateStudent(
              "registerNumber",
              value
            )
          }
          placeholder="Enter register number"
          type="number"
          onBlur={() => onRegisterNumberBlur(student.registerNumber)}
        />

        <FormField
          label="DEPARTMENT"
          value={student.department}
          onChange={(value) =>
            updateStudent(
              "department",
              value
            )
          }
          placeholder="Select department"
          options={DEPARTMENT_OPTIONS}
        />

        <div className="form-field">
          <label>YEAR</label>

          <select
            value={student.year}
            onChange={(event) =>
              updateStudent(
                "year",
                event.target.value
              )
            }
          >
            <option value="">
              Select year
            </option>

            

            <option value="2nd Year">
              2nd Year
            </option>

            <option value="3rd Year">
              3rd Year
            </option>

            <option value="4th Year">
              4th Year
            </option>

          </select>
        </div>

        <FormField
          label="EMAIL ADDRESS"
          type="email"
          value={student.email}
          onChange={(value) =>
            updateStudent(
              "email",
              value
            )
          }
          placeholder="you@example.com"
        />

        <FormField
          label="PHONE NUMBER"
          type="tel"
          value={student.phone}
          onChange={(value) =>
            updateStudent(
              "phone",
              value
            )
          }
          placeholder="Enter phone number"
        />
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  options,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  options?: { label: string; value: string }[];
  onBlur?: () => void;
}) {
  return (
    <div className="form-field">
      <label>{label}</label>

      {options ? (
        <select
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) =>
            onChange(event.target.value)
          }
          onBlur={onBlur}
        />
      )}
    </div>
  );
}

/* =========================================================
   STEP 2
========================================================= */

function EventSelectionStep({
  events,
  selectedEvents,
  participationModes,
  toggleEvent,
  setParticipationMode,
}: {
  events: EventItem[];
  selectedEvents: string[];
  participationModes: Record<string, "individual" | "team">;
  toggleEvent: (eventId: string) => void;
  setParticipationMode: (eventId: string, mode: "individual" | "team") => void;
}) {
  const technicalEvents =
    events.filter(
      (event) =>
        event.category === "technical"
    );

  const nonTechnicalEvents =
    events.filter(
      (event) =>
        event.category ===
        "non-technical"
    );

  return (
    <div className="form-step">
      <div className="form-heading">
        <div className="form-step-number">
          02
        </div>

        <div>
          <h2>
            SELECT EVENTS
          </h2>

          <p>
            Choose one or more events
            you want to participate in.
          </p>
        </div>
      </div>

      <EventSelectionGroup
        title="TECHNICAL EVENTS"
        events={technicalEvents}
        selectedEvents={selectedEvents}
        participationModes={participationModes}
        toggleEvent={toggleEvent}
        setParticipationMode={setParticipationMode}
      />

      <EventSelectionGroup
        title="NON-TECHNICAL EVENTS"
        events={nonTechnicalEvents}
        selectedEvents={selectedEvents}
        participationModes={participationModes}
        toggleEvent={toggleEvent}
        setParticipationMode={setParticipationMode}
      />
    </div>
  );
}

function EventSelectionGroup({
  title,
  events,
  selectedEvents,
  participationModes,
  toggleEvent,
  setParticipationMode,
}: {
  title: string;
  events: EventItem[];
  selectedEvents: string[];
  participationModes: Record<string, "individual" | "team">;
  toggleEvent: (eventId: string) => void;
  setParticipationMode: (eventId: string, mode: "individual" | "team") => void;
}) {
  return (
    <div className="selection-group">
      <div className="selection-group-title">
        <span />
        {title}
      </div>

      <div className="registration-event-grid">
        {events.map((event) => {
          const selected =
            selectedEvents.includes(
              event.id
            );

          return (
            <div
              key={event.id}
              className={`registration-event ${selected ? "selected" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => toggleEvent(event.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleEvent(event.id);
                }
              }}
            >
              <div className={`registration-event-poster ${event.posterImage ? "has-poster-image" : ""}`}>
                {event.posterImage ? (
                  <img src={event.posterImage} alt={`${event.name} poster`} />
                ) : (
                  <span>{event.poster}</span>
                )}

                {selected && (
                  <div className="selected-check">
                    ✓
                  </div>
                )}
              </div>

              <div className="registration-event-info">
                <div className="registration-event-type">
                  {event.mode === "team"
                    ? `TEAM · UP TO ${event.teamSize}`
                    : event.mode === "individual-or-team"
                      ? "INDIVIDUAL OR TEAM"
                      : "INDIVIDUAL"}
                </div>

                {event.mode === "individual-or-team" && selected && (
                  <div className="participation-mode-choice" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className={participationModes[event.id] !== "team" ? "active" : ""} onClick={() => setParticipationMode(event.id, "individual")}>INDIVIDUAL</button>
                    <button type="button" className={participationModes[event.id] === "team" ? "active" : ""} onClick={() => setParticipationMode(event.id, "team")}>TEAM</button>
                  </div>
                )}

                <h3>
                  {event.name}
                </h3>

                <p>
                  {event.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   STEP 3
========================================================= */

function TeamDetailsStep({
  teamEvents,
  teams,
  student,
  updateTeamName,
  updateTeamMember,
}: {
  teamEvents: EventItem[];
  teams: Record<
    string,
    TeamDetails
  >;
  student: StudentDetails;
  updateTeamName: (
    eventId: string,
    name: string
  ) => void;
  updateTeamMember: (
    eventId: string,
    index: number,
    field: keyof TeamMember,
    value: string
  ) => void;
}) {
  return (
    <div className="form-step">
      <div className="form-heading">
        <div className="form-step-number">
          03
        </div>

        <div>
          <h2>
            TEAM DETAILS
          </h2>

          <p>
            Add team details for each
            team event you selected.
          </p>
        </div>
      </div>

      <div className="team-event-sections">
        {teamEvents.map((event) => {
          const team =
            teams[event.id] ?? {
              teamName: "",
              members:
                Array.from(
                  {
                    length:
                      event.teamSize ||
                      4,
                  },
                  (_, index) => ({
                    name:
                      index === 0
                        ? student.fullName
                        : "",
                    registerNumber:
                      index === 0
                        ? student.registerNumber
                        : "",
                  })
                ),
            };

          return (
            <div
              className="team-event-card"
              key={event.id}
            >
              <div className="team-event-header">
                <div>
                  <span>
                    TEAM EVENT
                  </span>

                  <h3>
                    {event.name}
                  </h3>
                </div>

                <strong>
                  {team.members.length
                    .toString()
                    .padStart(2, "0")}
                </strong>
              </div>

              <div className="team-name-field">
                <label>
                  TEAM NAME
                </label>

                <input
                  type="text"
                  value={
                    team.teamName
                  }
                  placeholder={`Enter team name for ${event.name}`}
                  onChange={(
                    inputEvent
                  ) =>
                    updateTeamName(
                      event.id,
                      inputEvent
                        .target
                        .value
                    )
                  }
                />
              </div>

              <div className="members-title">
                TEAM MEMBERS
              </div>

              <div className="members-table">
                <div className="member-table-head">
                  <span>
                    NO.
                  </span>

                  <span>
                    MEMBER NAME
                  </span>

                  <span>
                    REGISTER NUMBER
                  </span>
                </div>

                {team.members.map(
                  (
                    member,
                    index
                  ) => (
                    <div
                      className="member-row"
                      key={`${event.id}-${index}`}
                    >
                      <span className="member-number">
                        {(
                          index + 1
                        )
                          .toString()
                          .padStart(
                            2,
                            "0"
                          )}
                      </span>

                      <input
                        type="text"
                        value={
                          index === 0
                            ? student.fullName
                            : member.name
                        }
                        placeholder="Member name"
                        readOnly={index === 0}
                        onChange={(
                          inputEvent
                        ) =>
                          updateTeamMember(
                            event.id,
                            index,
                            "name",
                            inputEvent
                              .target
                              .value
                          )
                        }
                      />

                      <input
                        type="text"
                        value={
                          index === 0
                            ? student.registerNumber
                            : member.registerNumber
                        }
                        placeholder="Register number"
                        readOnly={index === 0}
                        onChange={(
                          inputEvent
                        ) =>
                          updateTeamMember(
                            event.id,
                            index,
                            "registerNumber",
                            inputEvent
                              .target
                              .value
                          )
                        }
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   STEP 4
========================================================= */

function ReviewStep({
  events,
  student,
  selectedEvents,
  teams,
  onEditStep,
}: {
  events: EventItem[];
  student: StudentDetails;
  selectedEvents: string[];
  teams: Record<
    string,
    TeamDetails
  >;
  onEditStep: (
    step: number
  ) => void;
}) {
  return (
    <div className="form-step">
      <div className="form-heading">
        <div className="form-step-number">
          04
        </div>

        <div>
          <h2>REVIEW</h2>

          <p>
            Check your details before
            confirming registration.
          </p>
        </div>
      </div>

      <div className="review-section">
        <div className="review-header">
          <span>
            STUDENT DETAILS
          </span>

          <button
            onClick={() =>
              onEditStep(1)
            }
          >
            EDIT
          </button>
        </div>

        <div className="review-grid">
          <ReviewItem
            label="NAME"
            value={
              student.fullName
            }
          />

          <ReviewItem
            label="REGISTER NUMBER"
            value={
              student.registerNumber
            }
          />

          <ReviewItem
            label="DEPARTMENT"
            value={
              student.department
            }
          />

          <ReviewItem
            label="YEAR"
            value={student.year}
          />

          <ReviewItem
            label="EMAIL"
            value={student.email}
          />

          <ReviewItem
            label="PHONE"
            value={student.phone}
          />
        </div>
      </div>

      <div className="review-section">
        <div className="review-header">
          <span>
            SELECTED EVENTS
          </span>

          <button
            onClick={() =>
              onEditStep(2)
            }
          >
            EDIT
          </button>
        </div>

        <div className="review-events">
          {selectedEvents.map(
            (
              eventId,
              index
            ) => {
              const event =
                events.find(
                  (item) =>
                    item.id ===
                    eventId
                );

              if (!event)
                return null;

              return (
                <div
                  className="review-event"
                  key={event.id}
                >
                  <span>
                    {(index + 1)
                      .toString()
                      .padStart(
                        2,
                        "0"
                      )}
                  </span>

                  <strong>
                    {event.name}
                  </strong>

                  <small>
                    {event.mode ===
                      "team"
                      ? "TEAM"
                      : "INDIVIDUAL"}
                  </small>
                </div>
              );
            }
          )}
        </div>
      </div>

      {Object.keys(teams).length >
        0 && (
          <div className="review-section">
            <div className="review-header">
              <span>
                TEAM DETAILS
              </span>

              <button
                onClick={() =>
                  onEditStep(3)
                }
              >
                EDIT
              </button>
            </div>

            <div className="review-teams">
              {Object.entries(
                teams
              ).map(
                ([
                  eventId,
                  team,
                ]) => {
                  const event =
                    events.find(
                      (item) =>
                        item.id ===
                        eventId
                    );

                  if (!event)
                    return null;

                  return (
                    <div
                      className="review-team"
                      key={eventId}
                    >
                      <div className="review-team-title">
                        <strong>
                          {event.name}
                        </strong>

                        <span>
                          {
                            team.teamName
                          }
                        </span>
                      </div>

                      {team.members.map(
                        (
                          member,
                          index
                        ) => (
                          <div
                            className="review-member"
                            key={`${eventId}-${index}`}
                          >
                            <span>
                              {(
                                index + 1
                              )
                                .toString()
                                .padStart(
                                  2,
                                  "0"
                                )}
                            </span>

                            <strong>
                              {
                                member.name
                              }
                            </strong>

                            <small>
                              {
                                member.registerNumber
                              }
                            </small>
                          </div>
                        )
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}
    </div>
  );
}

function ReviewItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="review-item">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================
   ADMIN LOGIN
========================================================= */

function AdminLogin({
  onLogin,
}: {
  onLogin: () => void;
}) {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const login = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (
      username === "admin" &&
      password === "dynamoz@admin"
    ) {
      // Keep admin authentication only in React memory.
      // A page refresh will reset this state and require login again.
      onLogin();
    } else {
      alert(
        "Invalid username or password."
      );
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <img
          src={DEmblem}
          alt="DYNAMOZ"
        />

        <div className="registration-kicker">
          DYNAMOZ 26 / RESTRICTED ACCESS
        </div>

        <h1>
          ADMIN
          <br />
          <span>PORTAL</span>
        </h1>

        <form onSubmit={login}>
          <div className="form-field">
            <label>
              USERNAME
            </label>

            <input
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value
                )
              }
              placeholder="Enter username"
            />
          </div>

          <div className="form-field">
            <label>
              PASSWORD
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter password"
            />
          </div>

          <button
            className="primary-button full"
            type="submit"
          >
            LOGIN
            <span>↗</span>
          </button>
        </form>

        <div className="admin-login-hint">
          ADMIN ACCESS
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

type AdminTab =
  | "dashboard"
  | "website"
  | "events"
  | "registrations";

function AdminPage({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const [tab, setTab] =
    useState<AdminTab>(
      "dashboard"
    );

  const [events, setEvents] =
    useState<EventItem[]>(
      getStoredEvents()
    );

  const [config, setConfig] =
    useState<SiteConfig>(
      getStoredConfig()
    );

  const [registrations, setRegistrations] =
    useState<Registration[]>(
      getStoredRegistrations()
    );

  const [selectedEventId, setSelectedEventId] =
    useState(getStoredEvents()[0]?.id ?? "");

  const [cloudHydrated, setCloudHydrated] = useState(false);
  const skipNextEventsSave = useRef(false);
  const skipNextConfigSave = useRef(false);

  // While an admin edit is being written, do not let an older Firestore
  // snapshot briefly overwrite the new local state (the poster "changes,
  // then changes back" problem).
  const pendingEventsValueRef = useRef<string | null>(null);
  const pendingEventsWriteRef = useRef(0);

  const selectedEvent =
    events.find(
      (event) =>
        event.id ===
        selectedEventId
    ) ?? events[0];

  useEffect(() => {
    if (!cloudHydrated) return;

    if (skipNextEventsSave.current) {
      skipNextEventsSave.current = false;
      return;
    }

    saveEvents(events);

    const serialized = JSON.stringify(events);
    pendingEventsValueRef.current = serialized;

    const writeId = pendingEventsWriteRef.current + 1;
    pendingEventsWriteRef.current = writeId;

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          await saveCloudAppState(EVENTS_KEY, events);
        } catch (error) {
          console.error(
            "Unable to save events to Firebase:",
            error
          );

          // Keep the latest local preview instead of silently replacing it
          // with an older cloud snapshot.
          if (
            pendingEventsWriteRef.current === writeId
          ) {
            pendingEventsValueRef.current = serialized;
          }

          alert(
            "The event changes could not be saved to Firebase. Please try again."
          );
        }
      })();
    }, 150);

    return () => window.clearTimeout(timer);
  }, [events, cloudHydrated]);

  useEffect(() => {
    if (!cloudHydrated) return;

    if (skipNextConfigSave.current) {
      skipNextConfigSave.current = false;
      return;
    }

    saveConfig(config);
    const timer = window.setTimeout(() => {
      void saveCloudAppState(CONFIG_KEY, config).catch((error) =>
        console.error("Unable to save site config to Firebase:", error)
      );
    }, 500);
    return () => window.clearTimeout(timer);
  }, [config, cloudHydrated]);

  useEffect(() => {
    let eventsReady = false;
    let configReady = false;

    const unsubscribeEvents = onSnapshot(
      doc(db, APP_STATE_TABLE, EVENTS_KEY),
      (snapshot) => {
        const value = snapshot.exists() ? snapshot.data().value : null;

        if (Array.isArray(value)) {
          void attachCloudPosters(value as EventItem[])
            .then((incomingEvents) => {
          const incomingSerialized =
            JSON.stringify(incomingEvents);

          const pending =
            pendingEventsValueRef.current;

          // Ignore stale remote data while the admin's latest edit is
          // waiting to be confirmed. Once Firestore sends the same value
          // back, the edit is confirmed and normal live syncing resumes.
          if (
            pending &&
            incomingSerialized !== pending
          ) {
            eventsReady = true;
            if (eventsReady && configReady) {
              setCloudHydrated(true);
            }
            return;
          }

          if (
            pending &&
            incomingSerialized === pending
          ) {
            pendingEventsValueRef.current = null;
          }

          skipNextEventsSave.current = true;
          setEvents(incomingEvents);
          saveEvents(incomingEvents);

          setSelectedEventId((current) =>
            incomingEvents.some(
              (event) => event.id === current
            )
              ? current
              : incomingEvents[0]?.id ?? ""
          );
            });
        }

        eventsReady = true;
        if (eventsReady && configReady) {
          setCloudHydrated(true);
        }
      },
      (error) => console.error("Firebase events listener error:", error)
    );

    const unsubscribeConfig = onSnapshot(
      doc(db, APP_STATE_TABLE, CONFIG_KEY),
      (snapshot) => {
        const value = snapshot.exists() ? snapshot.data().value : null;
        if (value && typeof value === "object") {
          const merged = { ...DEFAULT_CONFIG, ...(value as Partial<SiteConfig>) };
          skipNextConfigSave.current = true;
          setConfig(merged);
          saveConfig(merged);
        }
        configReady = true;
        if (eventsReady && configReady) setCloudHydrated(true);
      },
      (error) => console.error("Firebase config listener error:", error)
    );

    const unsubscribeRegistrations = onSnapshot(
      collection(db, "registrations"),
      (snapshot) => {
        const cloudRegistrations = snapshot.docs
          .map((item) => {
            const data = item.data() as Registration & { studentRegisterNumber?: string };
            return {
              id: data.id ?? item.id,
              student: data.student,
              selectedEvents: Array.isArray(data.selectedEvents) ? data.selectedEvents : [],
              teams: data.teams && typeof data.teams === "object" ? data.teams : {},
              createdAt: data.createdAt ?? "",
            } satisfies Registration;
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setRegistrations(cloudRegistrations);
        localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(cloudRegistrations));
      },
      (error) => console.error("Firebase registrations listener error:", error)
    );

    return () => {
      unsubscribeEvents();
      unsubscribeConfig();
      unsubscribeRegistrations();
    };
  }, []);

  const refreshRegistrations = async () => {
    try {
      const cloudRegistrations = await fetchCloudRegistrations();
      setRegistrations(cloudRegistrations);
      localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(cloudRegistrations));
    } catch (error) {
      console.error("Unable to load cloud registrations:", error);
      setRegistrations(getStoredRegistrations());
      alert("Unable to load cloud registrations. Showing the local cache.");
    }
  };

  useEffect(() => {
    void refreshRegistrations();
  }, []);

  const updateConfig = <
    K extends keyof SiteConfig
  >(
    field: K,
    value: SiteConfig[K]
  ) => {
    setConfig((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateEvent = (
    eventId: string,
    updates: Partial<EventItem>
  ) => {
    setEvents((current) =>
      current.map((event) =>
        event.id === eventId
          ? {
            ...event,
            ...updates,
          }
          : event
      )
    );
  };

  const addEvent = () => {
    const newEvent: EventItem = {
      id: generateId("event"),
      name: "NEW EVENT",
      category: "technical",
      mode: "individual",
      description:
        "Add event description here.",
      poster: "NEW",
      teamSize: 1,
      rules:
        "Add event rules here.",
      eligibility:
        "Add eligibility details here.",
      prize:
        "Add prize details here.",
      enabled: true,
      rounds: [],
    };

    setEvents((current) => [
      ...current,
      newEvent,
    ]);

    setSelectedEventId(
      newEvent.id
    );

    setTab("events");
  };

  const deleteEvent = (
    eventId: string
  ) => {
    const event =
      events.find(
        (item) =>
          item.id === eventId
      );

    if (!event) return;

    const confirmed =
      window.confirm(
        `Delete "${event.name}"? This cannot be undone.`
      );

    if (!confirmed) return;

    const remaining =
      events.filter(
        (item) =>
          item.id !== eventId
      );

    setEvents(remaining);

    setSelectedEventId(
      remaining[0]?.id ?? ""
    );
  };

  const addRound = () => {
    if (!selectedEvent)
      return;

    const round: EventRound = {
      id: generateId("round"),
      name: `ROUND ${selectedEvent.rounds.length +
        1
        }`,
      description:
        "Add round description.",
      date: "2026-09-10",
      startTime: "10:00",
      endTime: "11:00",
      venue: "Venue TBA",
      mode: "Offline",
    };

    updateEvent(
      selectedEvent.id,
      {
        rounds: [
          ...selectedEvent.rounds,
          round,
        ],
      }
    );
  };

  const updateRound = (
    roundId: string,
    updates: Partial<EventRound>
  ) => {
    if (!selectedEvent)
      return;

    updateEvent(
      selectedEvent.id,
      {
        rounds:
          selectedEvent.rounds.map(
            (round) =>
              round.id ===
                roundId
                ? {
                  ...round,
                  ...updates,
                }
                : round
          ),
      }
    );
  };

  const deleteRound = (
    roundId: string
  ) => {
    if (!selectedEvent)
      return;

    updateEvent(
      selectedEvent.id,
      {
        rounds:
          selectedEvent.rounds.filter(
            (round) =>
              round.id !==
              roundId
          ),
      }
    );
  };

  const logout = () => {
    localStorage.removeItem(
      "dynamoz26_admin_auth"
    );

    onLogout();
  };

  if (!selectedEvent && tab === "events") {
    return (
      <div className="admin-page">
        <AdminSidebar
          tab={tab}
          setTab={setTab}
          onLogout={logout}
        />

        <main className="admin-main">
          <AdminEmptyEvents
            onAdd={addEvent}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminSidebar
        tab={tab}
        setTab={setTab}
        onLogout={logout}
      />

      <main className="admin-main">
        {tab === "dashboard" && (
          <AdminDashboard
            config={config}
            events={events}
            registrations={
              registrations
            }
            onRefresh={
              refreshRegistrations
            }
          />
        )}

        {tab === "website" && (
          <WebsiteEditor
            config={config}
            updateConfig={
              updateConfig
            }
          />
        )}

        {tab === "events" && (
          <EventEditor
            events={events}
            selectedEvent={
              selectedEvent
            }
            selectedEventId={
              selectedEventId
            }
            setSelectedEventId={
              setSelectedEventId
            }
            updateEvent={
              updateEvent
            }
            addEvent={addEvent}
            deleteEvent={
              deleteEvent
            }
            addRound={addRound}
            updateRound={
              updateRound
            }
            deleteRound={
              deleteRound
            }
          />
        )}

        {tab === "registrations" && (
          <RegistrationManager
            events={events}
            registrations={
              registrations
            }
            refresh={
              refreshRegistrations
            }
          />
        )}
      </main>
    </div>
  );
}

/* =========================================================
   ADMIN SIDEBAR
========================================================= */

function AdminSidebar({
  tab,
  setTab,
  onLogout,
}: {
  tab: AdminTab;
  setTab: (
    tab: AdminTab
  ) => void;
  onLogout: () => void;
}) {
  const items: {
    id: AdminTab;
    label: string;
    icon: string;
  }[] = [
      {
        id: "dashboard",
        label: "DASHBOARD",
        icon: "⌂",
      },
      {
        id: "website",
        label: "WEBSITE EDITOR",
        icon: "✎",
      },
      {
        id: "events",
        label: "EVENT MANAGEMENT",
        icon: "◆",
      },
      {
        id: "registrations",
        label: "REGISTRATIONS",
        icon: "▣",
      },
    ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-logo">
        <img
          src={DEmblem}
          alt="DYNAMOZ"
        />

        <strong>
          DYNAMOZ{" "}
          <span>26</span>
        </strong>
      </div>

      <div className="admin-sidebar-label">
        CONTROL CENTER
      </div>

      {items.map((item) => (
        <button
          key={item.id}
          className={
            tab === item.id
              ? "active"
              : ""
          }
          onClick={() =>
            setTab(item.id)
          }
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}

      <div className="admin-sidebar-footer">
        <small>
          DYNAMOZ 26 ADMIN
        </small>

        <small>
          DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
        </small>

        <button
          className="admin-logout"
          onClick={onLogout}
        >
          ↪ LOGOUT
        </button>
      </div>
    </aside>
  );
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function AdminDashboard({
  config,
  events,
  registrations,
  onRefresh,
}: {
  config: SiteConfig;
  events: EventItem[];
  registrations: Registration[];
  onRefresh: () => void;
}) {
  const registrationClosed =
    !config.registrationEnabled ||
    isRegistrationDeadlinePassed(
      config.registrationDeadline
    );

  const eventCounts = events.map(
    (event) => ({
      event,
      count: registrations.filter(
        (registration) =>
          registration.selectedEvents.includes(
            event.id
          )
      ).length,
    })
  );

  return (
    <div className="admin-dashboard">
      <AdminTopbar
        eyebrow="DYNAMOZ 26 / ADMIN"
        title="CONTROL CENTER"
        action={
          <button
            className="admin-refresh"
            onClick={onRefresh}
          >
            ↻ REFRESH
          </button>
        }
      />

      <div className="admin-stats">
        <div>
          <span>
            TOTAL REGISTRATIONS
          </span>

          <strong>
            {registrations.length}
          </strong>
        </div>

        <div>
          <span>
            ACTIVE EVENTS
          </span>

          <strong>
            {
              events.filter(
                (event) =>
                  event.enabled
              ).length
            }
          </strong>
        </div>

        <div>
          <span>
            REGISTRATION STATUS
          </span>

          <strong>
            {registrationClosed
              ? "CLOSED"
              : "OPEN"}
          </strong>
        </div>

        <div>
          <span>
            DEADLINE
          </span>

          <strong>
            {formatDate(
              config.registrationDeadline
            )}
          </strong>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <span>
                EVENT PERFORMANCE
              </span>

              <h2>
                REGISTRATIONS BY EVENT
              </h2>
            </div>
          </div>

          <div className="admin-event-list">
            {eventCounts.map(
              ({
                event,
                count,
              }) => (
                <div
                  className="admin-event-list-row"
                  key={event.id}
                >
                  <div>
                    <strong>
                      {event.name}
                    </strong>

                    <small>
                      {event.category.toUpperCase()}{" "}
                      ·{" "}
                      {event.mode.toUpperCase()}
                    </small>
                  </div>

                  <strong>
                    {count}
                  </strong>
                </div>
              )
            )}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <span>
                EVENT INFORMATION
              </span>

              <h2>
                CURRENT SETTINGS
              </h2>
            </div>
          </div>

          <div className="admin-info-list">
            <div>
              <span>
                EVENT DATE
              </span>

              <strong>
                {formatDate(
                  config.eventDate
                )}
              </strong>
            </div>

            <div>
              <span>
                REGISTRATION DEADLINE
              </span>

              <strong>
                {formatDate(
                  config.registrationDeadline
                )}
              </strong>
            </div>

            <div>
              <span>
                DEPARTMENT
              </span>

              <strong>
                {config.department}
              </strong>
            </div>

            <div>
              <span>
                INSTITUTION
              </span>

              <strong>
                {config.institution}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <span>
              RECENT ACTIVITY
            </span>

            <h2>
              LATEST REGISTRATIONS
            </h2>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  REG ID
                </th>

                <th>
                  NAME
                </th>

                <th>
                  REGISTER NUMBER
                </th>

                <th>
                  EVENTS
                </th>

                <th>
                  REGISTERED AT
                </th>
              </tr>
            </thead>

            <tbody>
              {registrations
                .slice(-10)
                .reverse()
                .map(
                  (
                    registration
                  ) => (
                    <tr
                      key={
                        registration.id
                      }
                    >
                      <td>
                        {
                          registration.id
                        }
                      </td>

                      <td>
                        {
                          registration
                            .student
                            .fullName
                        }
                      </td>

                      <td>
                        {
                          registration
                            .student
                            .registerNumber
                        }
                      </td>

                      <td>
                        {
                          registration
                            .selectedEvents
                            .length
                        }
                      </td>

                      <td>
                        {new Date(
                          registration.createdAt
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>
                    </tr>
                  )
                )}

              {registrations.length ===
                0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="empty-admin"
                    >
                      NO REGISTRATIONS YET
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN TOPBAR
========================================================= */

function AdminTopbar({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-topbar">
      <div>
        <div className="registration-kicker">
          {eyebrow}
        </div>

        <h1>{title}</h1>
      </div>

      {action}
    </div>
  );
}

/* =========================================================
   WEBSITE EDITOR
========================================================= */

function WebsiteEditor({
  config,
  updateConfig,
}: {
  config: SiteConfig;
  updateConfig: <
    K extends keyof SiteConfig
  >(
    field: K,
    value: SiteConfig[K]
  ) => void;
}) {
  const [uploadingPersonId, setUploadingPersonId] =
    useState<string | null>(null);

  const compressPersonPhoto = (
    file: File
  ) =>
    new Promise<string>((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const maxDimension = 520;
        const scale = Math.min(
          1,
          maxDimension / Math.max(image.width, image.height)
        );

        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Unable to prepare staff photo."));
          return;
        }

        context.drawImage(image, 0, 0, width, height);

        const qualities = [0.82, 0.72, 0.62, 0.52, 0.42];
        const maxBytes = 70 * 1024;

        const tryQuality = (index: number) => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("Unable to compress staff photo."));
              return;
            }

            if (blob.size > maxBytes && index < qualities.length - 1) {
              tryQuality(index + 1);
              return;
            }

            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ""));
            reader.onerror = () =>
              reject(new Error("Unable to read compressed staff photo."));
            reader.readAsDataURL(blob);
          }, "image/webp", qualities[index]);
        };

        tryQuality(0);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Unable to load staff photo."));
      };

      image.src = objectUrl;
    });

  const uploadPersonPhoto = async (
    personId: string,
    file: File
  ) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Please choose an image smaller than 10 MB.");
      return;
    }

    setUploadingPersonId(personId);

    try {
      // Only two staff photos are used. They are compressed to small WEBP
      // data URLs and saved with the existing Firestore site config, so no
      // Firebase Storage bucket or Storage rules are required.
      const compressedPhoto = await compressPersonPhoto(file);

      updatePerson(personId, {
        photo: compressedPhoto,
      });
    } catch (error) {
      console.error("Unable to process staff photo:", error);
      alert("Unable to process this staff photo. Please try another image.");
    } finally {
      setUploadingPersonId(null);
    }
  };

  const updatePerson = (
    id: string,
    updates: Partial<Person>
  ) => {
    updateConfig(
      "people",
      config.people.map(
        (person) =>
          person.id === id
            ? {
              ...person,
              ...updates,
            }
            : person
      )
    );
  };

  const addPerson = () => {
    updateConfig(
      "people",
      [
        ...config.people,
        {
          id: generateId("person"),
          role: "NEW ROLE",
          name: "New Person",
          initials: "NP",
          photo: null,
          description:
            "Add person description.",
        },
      ]
    );
  };

  const deletePerson = (
    id: string
  ) => {
    updateConfig(
      "people",
      config.people.filter(
        (person) =>
          person.id !== id
      )
    );
  };

  return (
    <div className="admin-editor">
      <AdminTopbar
        eyebrow="DYNAMOZ 26 / WEBSITE"
        title="WEBSITE EDITOR"
      />

      <div className="admin-save-banner">
        <span>
          ✓ CHANGES ARE SAVED AUTOMATICALLY
        </span>

        <small>
          Edit the fields below. Public website updates instantly.
        </small>
      </div>

      <AdminEditorSection
        number="01"
        title="HERO SECTION"
        subtitle="Edit the main landing page content."
      >
        <div className="admin-form-grid">
          <AdminInput
            label="WELCOME TEXT"
            value={
              config.heroWelcome
            }
            onChange={(value) =>
              updateConfig(
                "heroWelcome",
                value
              )
            }
          />

          <AdminInput
            label="MAIN TITLE"
            value={
              config.heroTitle
            }
            onChange={(value) =>
              updateConfig(
                "heroTitle",
                value
              )
            }
          />

          <AdminInput
            label="YEAR"
            value={
              config.heroYear
            }
            onChange={(value) =>
              updateConfig(
                "heroYear",
                value
              )
            }
          />

          <AdminInput
            label="TAGLINE 1"
            value={
              config.heroTaglineOne
            }
            onChange={(value) =>
              updateConfig(
                "heroTaglineOne",
                value
              )
            }
          />

          <AdminInput
            label="TAGLINE 2"
            value={
              config.heroTaglineTwo
            }
            onChange={(value) =>
              updateConfig(
                "heroTaglineTwo",
                value
              )
            }
          />

          <AdminInput
            label="TAGLINE 3"
            value={
              config.heroTaglineThree
            }
            onChange={(value) =>
              updateConfig(
                "heroTaglineThree",
                value
              )
            }
          />
        </div>
      </AdminEditorSection>

      <AdminEditorSection
        number="02"
        title="EVENT & REGISTRATION SETTINGS"
        subtitle="Control event date and registration availability."
      >
        <div className="admin-form-grid">
          <AdminInput
            label="EVENT DATE & TIME"
            type="datetime-local"
            value={
              config.eventDate
            }
            onChange={(value) =>
              updateConfig(
                "eventDate",
                value
              )
            }
          />

          <AdminInput
            label="REGISTRATION DEADLINE"
            type="datetime-local"
            value={
              config.registrationDeadline
            }
            onChange={(value) =>
              updateConfig(
                "registrationDeadline",
                value
              )
            }
          />
        </div>

        <div className="admin-toggle-row">
          <div>
            <strong>
              REGISTRATION ENABLED
            </strong>

            <small>
              Manually open or close registrations.
            </small>
          </div>

          <button
            className={`admin-toggle ${config.registrationEnabled
                ? "active"
                : ""
              }`}
            onClick={() =>
              updateConfig(
                "registrationEnabled",
                !config.registrationEnabled
              )
            }
          >
            <span />
          </button>
        </div>

        <div className="admin-deadline-preview">
          <span>
            CURRENT STATUS
          </span>

          <strong>
            {!config.registrationEnabled
              ? "CLOSED BY ADMIN"
              : isRegistrationDeadlinePassed(
                config.registrationDeadline
              )
                ? "CLOSED — DEADLINE PASSED"
                : "OPEN — ACCEPTING REGISTRATIONS"}
          </strong>
        </div>
      </AdminEditorSection>

      <AdminEditorSection
        number="03"
        title="ABOUT SECTION"
        subtitle="Edit the public About content."
      >
        <AdminTextarea
          label="SUBTITLE"
          value={
            config.aboutSubtitle
          }
          onChange={(value) =>
            updateConfig(
              "aboutSubtitle",
              value
            )
          }
        />

        <AdminTextarea
          label="LEAD CONTENT"
          value={
            config.aboutLead
          }
          onChange={(value) =>
            updateConfig(
              "aboutLead",
              value
            )
          }
        />

        <AdminTextarea
          label="DESCRIPTION"
          value={
            config.aboutDescription
          }
          onChange={(value) =>
            updateConfig(
              "aboutDescription",
              value
            )
          }
        />

        <div className="admin-form-grid">
          <AdminInput
            label="DEPARTMENT"
            value={
              config.department
            }
            onChange={(value) =>
              updateConfig(
                "department",
                value
              )
            }
          />

          <AdminInput
            label="INSTITUTION"
            value={
              config.institution
            }
            onChange={(value) =>
              updateConfig(
                "institution",
                value
              )
            }
          />
        </div>
      </AdminEditorSection>

      <AdminEditorSection
        number="04"
        title="PEOPLE / TEAM"
        subtitle="Add or edit the people displayed on the website."
      >
        <div className="admin-people-editor">
          {config.people.map(
            (person) => (
              <div
                className="admin-person-editor"
                key={person.id}
              >
                <div className="admin-person-editor-top">
                  <strong>
                    {person.name}
                  </strong>

                  <button
                    className="admin-danger-button"
                    onClick={() =>
                      deletePerson(
                        person.id
                      )
                    }
                  >
                    DELETE
                  </button>
                </div>

                <div className="admin-form-grid">
                  <AdminInput
                    label="ROLE"
                    value={
                      person.role
                    }
                    onChange={(value) =>
                      updatePerson(
                        person.id,
                        {
                          role: value,
                        }
                      )
                    }
                  />

                  <AdminInput
                    label="NAME"
                    value={
                      person.name
                    }
                    onChange={(value) =>
                      updatePerson(
                        person.id,
                        {
                          name: value,
                        }
                      )
                    }
                  />

                  <AdminInput
                    label="INITIALS"
                    value={
                      person.initials
                    }
                    onChange={(value) =>
                      updatePerson(
                        person.id,
                        {
                          initials:
                            value,
                        }
                      )
                    }
                  />
                </div>

                <div className="admin-person-photo-field">
                  <div className="admin-person-photo-preview">
                    {person.photo ? (
                      <img
                        src={person.photo}
                        alt={person.name}
                      />
                    ) : (
                      <span>{person.initials || "?"}</span>
                    )}
                  </div>

                  <div className="admin-person-photo-actions">
                    <div>
                      <strong>STAFF PHOTO</strong>
                      <small>Upload a JPG, PNG, WEBP or other image up to 5 MB.</small>
                    </div>

                    <div className="admin-person-photo-buttons">
                      <label className="admin-photo-upload-button">
                        {uploadingPersonId === person.id
                          ? "UPLOADING..."
                          : person.photo
                            ? "CHANGE PHOTO"
                            : "UPLOAD PHOTO"}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingPersonId === person.id}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.currentTarget.value = "";
                            if (file) {
                              void uploadPersonPhoto(person.id, file);
                            }
                          }}
                        />
                      </label>

                      {person.photo && (
                        <button
                          type="button"
                          className="admin-photo-remove-button"
                          disabled={uploadingPersonId === person.id}
                          onClick={() =>
                            updatePerson(person.id, { photo: null })
                          }
                        >
                          REMOVE PHOTO
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <AdminTextarea
                  label="DESCRIPTION"
                  value={
                    person.description
                  }
                  onChange={(value) =>
                    updatePerson(
                      person.id,
                      {
                        description:
                          value,
                      }
                    )
                  }
                />
              </div>
            )
          )}
        </div>

        <button
          className="admin-secondary-button"
          onClick={addPerson}
        >
          + ADD PERSON
        </button>
      </AdminEditorSection>

      <AdminEditorSection
        number="05"
        title="CONTACT"
        subtitle="Edit contact information."
      >
        <div className="admin-form-grid">
          <AdminInput
            label="DEPARTMENT"
            value={
              config.contactDepartment
            }
            onChange={(value) =>
              updateConfig(
                "contactDepartment",
                value
              )
            }
          />

          <AdminInput
            label="INSTITUTION"
            value={
              config.contactInstitution
            }
            onChange={(value) =>
              updateConfig(
                "contactInstitution",
                value
              )
            }
          />

          <AdminInput
            label="EMAIL"
            value={
              config.contactEmail
            }
            onChange={(value) =>
              updateConfig(
                "contactEmail",
                value
              )
            }
          />

          <AdminInput
            label="LOCATION"
            value={
              config.contactLocation
            }
            onChange={(value) =>
              updateConfig(
                "contactLocation",
                value
              )
            }
          />
        </div>
      </AdminEditorSection>

      <AdminEditorSection
        number="06"
        title="STUDENT COORDINATORS"
        subtitle="Add student coordinator names and phone numbers. Empty or incomplete entries stay hidden on the public website."
      >
        <div className="admin-stack">
          {(config.studentCoordinators ?? []).map(
            (coordinator, index) => (
              <div className="admin-person-card" key={`student-coordinator-${index}`}>
                <div className="admin-form-grid">
                  <AdminInput
                    label="NAME"
                    value={coordinator.name}
                    onChange={(value) => {
                      const next = [...(config.studentCoordinators ?? [])];
                      next[index] = { ...next[index], name: value };
                      updateConfig("studentCoordinators", next);
                    }}
                  />

                  <AdminInput
                    label="PHONE"
                    value={coordinator.phone}
                    onChange={(value) => {
                      const next = [...(config.studentCoordinators ?? [])];
                      next[index] = { ...next[index], phone: value };
                      updateConfig("studentCoordinators", next);
                    }}
                  />
                </div>

                <button
                  className="admin-danger-button"
                  onClick={() => {
                    const next = (config.studentCoordinators ?? []).filter(
                      (_, coordinatorIndex) => coordinatorIndex !== index
                    );
                    updateConfig("studentCoordinators", next);
                  }}
                >
                  REMOVE
                </button>
              </div>
            )
          )}

          <button
            className="admin-secondary-button"
            onClick={() =>
              updateConfig("studentCoordinators", [
                ...(config.studentCoordinators ?? []),
                { name: "", phone: "" },
              ])
            }
          >
            + ADD STUDENT COORDINATOR
          </button>
        </div>
      </AdminEditorSection>

      <AdminEditorSection
        number="07"
        title="SOCIAL LINKS"
        subtitle="Add a general WhatsApp link. Leave it empty to hide it from the public website."
      >
        <div className="admin-form-grid">
          <AdminInput
            label="WHATSAPP URL"
            value={config.whatsapp}
            onChange={(value) => updateConfig("whatsapp", value)}
          />
        </div>
      </AdminEditorSection>
    </div>
  );
}

/* =========================================================
   ADMIN EVENT EDITOR
========================================================= */

function EventEditor({
  events,
  selectedEvent,
  selectedEventId,
  setSelectedEventId,
  updateEvent,
  addEvent,
  deleteEvent,
  addRound,
  updateRound,
  deleteRound,
}: {
  events: EventItem[];
  selectedEvent?: EventItem;
  selectedEventId: string;
  setSelectedEventId: (
    id: string
  ) => void;
  updateEvent: (
    id: string,
    updates: Partial<EventItem>
  ) => void;
  addEvent: () => void;
  deleteEvent: (
    id: string
  ) => void;
  addRound: () => void;
  updateRound: (
    id: string,
    updates: Partial<EventRound>
  ) => void;
  deleteRound: (
    id: string
  ) => void;
}) {
  return (
    <div className="admin-editor">
      <AdminTopbar
        eyebrow="DYNAMOZ 26 / EVENTS"
        title="EVENT MANAGEMENT"
        action={
          <button
            className="primary-button"
            onClick={addEvent}
          >
            + ADD EVENT
          </button>
        }
      />

      <div className="admin-event-editor-layout">
        <aside className="admin-event-list-sidebar">
          <div className="admin-sidebar-label">
            ALL EVENTS
          </div>

          {events.map((event) => (
            <button
              key={event.id}
              className={
                selectedEventId ===
                  event.id
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSelectedEventId(
                  event.id
                )
              }
            >
              <span>
                {event.category ===
                  "technical"
                  ? "TECH"
                  : "NON"}
              </span>

              <div>
                <strong>
                  {event.name}
                </strong>

                <small>
                  {event.mode ===
                    "team"
                    ? `TEAM · ${event.teamSize}`
                    : "INDIVIDUAL"}
                </small>
              </div>

              {!event.enabled && (
                <em>
                  HIDDEN
                </em>
              )}
            </button>
          ))}
        </aside>

        <div className="admin-event-editor">
          {!selectedEvent ? (
            <AdminEmptyEvents
              onAdd={addEvent}
            />
          ) : (
            <>
              <div className="admin-event-editor-heading">
                <div>
                  <span>
                    EVENT EDITOR
                  </span>

                  <h2>
                    {selectedEvent.name}
                  </h2>
                </div>

                <button
                  className="admin-danger-button"
                  onClick={() =>
                    deleteEvent(
                      selectedEvent.id
                    )
                  }
                >
                  DELETE EVENT
                </button>
              </div>

              <AdminEditorSection
                number="01"
                title="BASIC INFORMATION"
                subtitle="Everything displayed on the event card and details modal."
              >
                <div className="admin-form-grid">
                  <AdminInput
                    label="EVENT NAME"
                    value={
                      selectedEvent.name
                    }
                    onChange={(value) =>
                      updateEvent(
                        selectedEvent.id,
                        {
                          name: value,
                        }
                      )
                    }
                  />

                  <AdminInput
                    label="POSTER TEXT"
                    value={
                      selectedEvent.poster
                    }
                    onChange={(value) =>
                      updateEvent(
                        selectedEvent.id,
                        {
                          poster: value,
                        }
                      )
                    }
                  />

                  <AdminPosterUpload
                    value={selectedEvent.posterImage}
                    onChange={(value) =>
                      updateEvent(
                        selectedEvent.id,
                        { posterImage: value }
                      )
                    }
                  />

                  <AdminSelect
                    label="CATEGORY"
                    value={
                      selectedEvent.category
                    }
                    options={[
                      {
                        label:
                          "Technical",
                        value:
                          "technical",
                      },
                      {
                        label:
                          "Non-Technical",
                        value:
                          "non-technical",
                      },
                    ]}
                    onChange={(value) =>
                      updateEvent(
                        selectedEvent.id,
                        {
                          category:
                            value as EventCategory,
                        }
                      )
                    }
                  />

                  <AdminSelect
                    label="EVENT MODE"
                    value={
                      selectedEvent.mode
                    }
                    options={[
                      {
                        label:
                          "Individual",
                        value:
                          "individual",
                      },
                      {
                        label:
                          "Team",
                        value:
                          "team",
                      },
                      ...(selectedEvent.name.trim().toLowerCase() === "visual voice"
                        ? [{ label: "Individual or Team", value: "individual-or-team" }]
                        : []),
                    ]}
                    onChange={(value) =>
                      updateEvent(
                        selectedEvent.id,
                        {
                          mode:
                            value as EventMode,
                          teamSize:
                            value ===
                              "team"
                              || value === "individual-or-team"
                              ? Math.max(2, selectedEvent.teamSize || 4)
                              : 1,
                        }
                      )
                    }
                  />

                  {(selectedEvent.mode === "team" || selectedEvent.mode === "individual-or-team") && (
                      <AdminInput
                        label="MAX TEAM SIZE"
                        type="number"
                        value={String(
                          selectedEvent.teamSize
                        )}
                        onChange={(
                          value
                        ) =>
                          updateEvent(
                            selectedEvent.id,
                            {
                              teamSize:
                                Math.max(
                                  2,
                                  Number(
                                    value
                                  ) || 2
                                ),
                            }
                          )
                        }
                      />
                    )}
                </div>

                <AdminTextarea
                  label="DESCRIPTION"
                  value={
                    selectedEvent.description
                  }
                  onChange={(value) =>
                    updateEvent(
                      selectedEvent.id,
                      {
                        description:
                          value,
                      }
                    )
                  }
                />

                <AdminInput
                  label="THEME (OPTIONAL)"
                  value={selectedEvent.theme ?? ""}
                  onChange={(value) =>
                    updateEvent(
                      selectedEvent.id,
                      {
                        theme: value,
                      }
                    )
                  }
                />

                <AdminTextarea
                  label="DETAILED DESCRIPTION (OPTIONAL)"
                  value={selectedEvent.detailedDescription ?? ""}
                  onChange={(value) =>
                    updateEvent(
                      selectedEvent.id,
                      {
                        detailedDescription: value,
                      }
                    )
                  }
                />

                <div className="admin-toggle-row">
                  <div>
                    <strong>
                      SHOW THIS EVENT
                    </strong>

                    <small>
                      Disable this to hide the event from the public website and registration.
                    </small>
                  </div>

                  <button
                    className={`admin-toggle ${selectedEvent.enabled
                        ? "active"
                        : ""
                      }`}
                    onClick={() =>
                      updateEvent(
                        selectedEvent.id,
                        {
                          enabled:
                            !selectedEvent.enabled,
                        }
                      )
                    }
                  >
                    <span />
                  </button>
                </div>
              </AdminEditorSection>

              <AdminEditorSection
                number="02"
                title="EVENT INFORMATION"
                subtitle="Guidelines, eligibility and prize information."
              >
                <AdminTextarea
                  label="GUIDELINES"
                  value={
                    selectedEvent.rules
                  }
                  onChange={(value) =>
                    updateEvent(
                      selectedEvent.id,
                      {
                        rules: value,
                      }
                    )
                  }
                />

                <AdminTextarea
                  label="ELIGIBILITY"
                  value={
                    selectedEvent.eligibility
                  }
                  onChange={(value) =>
                    updateEvent(
                      selectedEvent.id,
                      {
                        eligibility:
                          value,
                      }
                    )
                  }
                />

                <AdminTextarea
                  label="PRIZE DETAILS"
                  value={
                    selectedEvent.prize
                  }
                  onChange={(value) =>
                    updateEvent(
                      selectedEvent.id,
                      {
                        prize: value,
                      }
                    )
                  }
                />

                <AdminInput
                  label="EVENT WHATSAPP GROUP URL"
                  value={selectedEvent.whatsappLink ?? ""}
                  onChange={(value) =>
                    updateEvent(selectedEvent.id, { whatsappLink: value })
                  }
                />
              </AdminEditorSection>

              <AdminEditorSection
                number="03"
                title="MULTIPLE ROUNDS"
                subtitle="Add as many rounds as this event needs."
                action={
                  <button
                    className="admin-secondary-button"
                    onClick={
                      addRound
                    }
                  >
                    + ADD ROUND
                  </button>
                }
              >
                {selectedEvent.rounds
                  .length === 0 ? (
                  <div className="admin-empty-editor">
                    <strong>
                      NO ROUNDS ADDED
                    </strong>

                    <span>
                      Click “ADD ROUND” to create Round 1.
                    </span>
                  </div>
                ) : (
                  <div className="admin-round-editor-list">
                    {selectedEvent.rounds.map(
                      (
                        round,
                        index
                      ) => (
                        <AdminRoundEditor
                          key={
                            round.id
                          }
                          round={
                            round
                          }
                          index={
                            index
                          }
                          updateRound={
                            updateRound
                          }
                          deleteRound={
                            deleteRound
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </AdminEditorSection>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ROUND EDITOR
========================================================= */

function AdminRoundEditor({
  round,
  index,
  updateRound,
  deleteRound,
}: {
  round: EventRound;
  index: number;
  updateRound: (
    id: string,
    updates: Partial<EventRound>
  ) => void;
  deleteRound: (
    id: string
  ) => void;
}) {
  return (
    <div className="admin-round-editor">
      <div className="admin-round-editor-heading">
        <div>
          <span>
            ROUND{" "}
            {(index + 1)
              .toString()
              .padStart(2, "0")}
          </span>

          <h3>
            {round.name}
          </h3>
        </div>

        <button
          className="admin-danger-button"
          onClick={() =>
            deleteRound(
              round.id
            )
          }
        >
          DELETE ROUND
        </button>
      </div>

      <div className="admin-form-grid">
        <AdminInput
          label="ROUND NAME"
          value={round.name}
          onChange={(value) =>
            updateRound(
              round.id,
              {
                name: value,
              }
            )
          }
        />

        <AdminInput
          label="DATE"
          type="date"
          value={round.date}
          onChange={(value) =>
            updateRound(
              round.id,
              {
                date: value,
              }
            )
          }
        />

        <AdminInput
          label="START TIME"
          type="time"
          value={
            round.startTime
          }
          onChange={(value) =>
            updateRound(
              round.id,
              {
                startTime:
                  value,
              }
            )
          }
        />

        <AdminInput
          label="END TIME"
          type="time"
          value={
            round.endTime
          }
          onChange={(value) =>
            updateRound(
              round.id,
              {
                endTime: value,
              }
            )
          }
        />

        <AdminInput
          label="VENUE"
          value={round.venue}
          onChange={(value) =>
            updateRound(
              round.id,
              {
                venue: value,
              }
            )
          }
        />

        <AdminSelect
          label="ROUND MODE"
          value={round.mode}
          options={[
            {
              label:
                "Offline",
              value:
                "Offline",
            },
            {
              label:
                "Online",
              value:
                "Online",
            },
            {
              label:
                "Hybrid",
              value:
                "Hybrid",
            },
          ]}
          onChange={(value) =>
            updateRound(
              round.id,
              {
                mode: value,
              }
            )
          }
        />
      </div>

      <AdminTextarea
        label="ROUND DESCRIPTION"
        value={
          round.description
        }
        onChange={(value) =>
          updateRound(
            round.id,
            {
              description:
                value,
            }
          )
        }
      />
    </div>
  );
}

/* =========================================================
   REGISTRATION MANAGER
========================================================= */

function RegistrationManager({
  events,
  registrations,
  refresh,
}: {
  events: EventItem[];
  registrations: Registration[];
  refresh: () => void;
}) {
  const [activeEvent, setActiveEvent] =
    useState(
      events[0]?.id ?? "all"
    );

  const [search, setSearch] =
    useState("");

  const eventRegistrations =
    registrations.filter(
      (registration) => {
        const matchesEvent =
          activeEvent ===
          "all" ||
          registration.selectedEvents.includes(
            activeEvent
          );

        const searchValue =
          search
            .trim()
            .toLowerCase();

        if (!searchValue)
          return matchesEvent;

        const student =
          registration.student;

        const matchesSearch =
          student.fullName
            .toLowerCase()
            .includes(
              searchValue
            ) ||
          student.registerNumber
            .toLowerCase()
            .includes(
              searchValue
            ) ||
          student.email
            .toLowerCase()
            .includes(
              searchValue
            ) ||
          registration.id
            .toLowerCase()
            .includes(
              searchValue
            );

        return (
          matchesEvent &&
          matchesSearch
        );
      }
    );

  const downloadData = () => {
    const selectedEvent =
      activeEvent === "all"
        ? null
        : events.find(
          (event) => event.id === activeEvent
        );

    const eventName =
      selectedEvent?.name ?? "All Events";

    const exportRegistrations =
      activeEvent === "all"
        ? eventRegistrations
        : eventRegistrations.filter(
          (registration) =>
            registration.selectedEvents.includes(
              activeEvent
            )
        );

    const rows: string[][] = [
      ["Dynamoz 26"],
      ["Computer Science and Engineering"],
      ["University College of Engineering Nagercoil"],
      [""],
      [`${eventName} Registration Report`],
      [`Total Registration : ${exportRegistrations.length}`],
      [""],
      [
        "Registration ID",
        "Name",
        "Register Number",
        "Department",
        "Year",
        "Email",
        "Phone",
        "Event",
        "Team Name",
        "Member 1",
        "Member 2",
        "Member 3",
        "Member 4",
        "Member 5",
        "Member 6",
        "Registered At",
      ],
    ];

    exportRegistrations.forEach(
      (registration) => {
        const eventNames =
          registration.selectedEvents
            .map(
              (eventId) =>
                events.find(
                  (event) =>
                    event.id === eventId
                )?.name ?? eventId
            )
            .join(" | ");

        const teamDetails =
          Object.entries(
            registration.teams
          )
            .map(
              ([eventId, team]) => {
                const event =
                  events.find(
                    (item) =>
                      item.id === eventId
                  );

                return `${event?.name ?? eventId}: ${team.teamName
                  } — ${team.members
                    .map(
                      (member) =>
                        `${member.name} (${member.registerNumber})`
                    )
                    .join(" | ")}`;
              }
            )
            .join(" || ");

        const selectedIds = activeEvent === "all"
          ? registration.selectedEvents
          : registration.selectedEvents.filter((id) => id === activeEvent);

        selectedIds.forEach((eventId) => {
          const event = events.find((item) => item.id === eventId);
          const team = registration.teams[eventId];
          const members = team?.members ?? [];
          rows.push([
            registration.id,
            registration.student.fullName,
            `="${String(registration.student.registerNumber ?? "").replace(/"/g, '""')}"`,
            registration.student.department,
            registration.student.year,
            registration.student.email,
            registration.student.phone,
            event?.name ?? eventId,
            team?.teamName ?? "",
            ...Array.from({ length: 6 }, (_, index) => members[index]?.name ?? ""),
            registration.createdAt,
          ]);
        });
      }
    );

    const safeEventName =
      eventName
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

    const filename =
      activeEvent === "all"
        ? "Dynamoz26_All_Registrations.csv"
        : `Dynamoz26_${safeEventName}_Registrations.csv`;

    downloadCSV(filename, rows);
  };


  return (
    <div className="admin-editor">
      <AdminTopbar
        eyebrow="DYNAMOZ 26 / ADMIN"
        title="REGISTRATION MANAGEMENT"
        action={
          <div className="admin-topbar-actions">
            <button
              className="admin-refresh"
              onClick={refresh}
            >
              ↻ REFRESH
            </button>

            <button
              className="primary-button"
              onClick={
                downloadData
              }
            >
              DOWNLOAD CSV
              <span>↓</span>
            </button>
          </div>
        }
      />

      <div className="admin-registration-toolbar">
        <div className="admin-event-tabs">
          <button
            className={
              activeEvent ===
                "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveEvent(
                "all"
              )
            }
          >
            ALL
          </button>

          {events.map(
            (event) => (
              <button
                key={event.id}
                className={
                  activeEvent ===
                    event.id
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveEvent(
                    event.id
                  )
                }
              >
                {event.name}
              </button>
            )
          )}
        </div>

        <input
          className="admin-search"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search name, register number, email..."
        />
      </div>

      <div className="admin-stats">
        <div>
          <span>
            FILTERED REGISTRATIONS
          </span>

          <strong>
            {eventRegistrations.length}
          </strong>
        </div>

        <div>
          <span>
            TOTAL REGISTRATIONS
          </span>

          <strong>
            {registrations.length}
          </strong>
        </div>

        <div>
          <span>
            SELECTED EVENT
          </span>

          <strong>
            {activeEvent ===
              "all"
              ? "ALL EVENTS"
              : events.find(
                (event) =>
                  event.id ===
                  activeEvent
              )?.name ??
              "EVENT"}
          </strong>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  REG ID
                </th>

                <th>
                  NAME
                </th>

                <th>
                  REGISTER NUMBER
                </th>

                <th>
                  DEPARTMENT
                </th>

                <th>
                  YEAR
                </th>

                <th>
                  EMAIL
                </th>

                <th>
                  PHONE
                </th>

                <th>
                  EVENTS
                </th>

                <th>
                  TEAM
                </th>
              </tr>
            </thead>

            <tbody>
              {eventRegistrations.map(
                (
                  registration
                ) => (
                  <tr
                    key={
                      registration.id
                    }
                  >
                    <td>
                      {
                        registration.id
                      }
                    </td>

                    <td>
                      {
                        registration
                          .student
                          .fullName
                      }
                    </td>

                    <td>
                      {
                        registration
                          .student
                          .registerNumber
                      }
                    </td>

                    <td>
                      {
                        registration
                          .student
                          .department
                      }
                    </td>

                    <td>
                      {
                        registration
                          .student
                          .year
                      }
                    </td>

                    <td>
                      {
                        registration
                          .student
                          .email
                      }
                    </td>

                    <td>
                      {
                        registration
                          .student
                          .phone
                      }
                    </td>

                    <td>
                      {
                        registration
                          .selectedEvents
                          .map(
                            (
                              eventId
                            ) =>
                              events.find(
                                (
                                  event
                                ) =>
                                  event.id ===
                                  eventId
                              )?.name ??
                              eventId
                          )
                          .join(
                            ", "
                          )}
                    </td>

                    <td>
                      {Object.values(
                        registration.teams
                      )
                        .map(
                          (
                            team
                          ) =>
                            team.teamName
                        )
                        .join(
                          ", "
                        ) ||
                        "Individual"}
                    </td>
                  </tr>
                )
              )}

              {eventRegistrations.length ===
                0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="empty-admin"
                    >
                      NO REGISTRATIONS FOUND
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN COMPONENTS
========================================================= */

function AdminEditorSection({
  number,
  title,
  subtitle,
  action,
  children,
}: {
  number: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-editor-section">
      <div className="admin-editor-section-heading">
        <div>
          <div className="admin-section-number">
            {number}
          </div>

          <div>
            <h2>{title}</h2>

            {subtitle && (
              <p>{subtitle}</p>
            )}
          </div>
        </div>

        {action}
      </div>

      <div className="admin-editor-section-body">
        {children}
      </div>
    </section>
  );
}

function AdminPosterUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string | null) => void;
}) {
  const [uploading, setUploading] =
    useState(false);

  const compressPoster = (
    file: File
  ) =>
    new Promise<string>(
      (resolve, reject) => {
        const image = new Image();
        const objectUrl =
          URL.createObjectURL(file);

        image.onload = () => {
          URL.revokeObjectURL(objectUrl);

          // Keeping posters small is important because the current app
          // stores the event list in one Firestore document.
          const maxWidth = 760;
          const scale =
            image.width > maxWidth
              ? maxWidth / image.width
              : 1;

          const width = Math.max(
            1,
            Math.round(image.width * scale)
          );

          const height = Math.max(
            1,
            Math.round(image.height * scale)
          );

          const canvas =
            document.createElement("canvas");

          canvas.width = width;
          canvas.height = height;

          const context =
            canvas.getContext("2d");

          if (!context) {
            reject(
              new Error(
                "Unable to prepare poster image."
              )
            );
            return;
          }

          context.drawImage(
            image,
            0,
            0,
            width,
            height
          );

          const qualities = [
            0.82,
            0.72,
            0.62,
            0.52,
            0.42,
          ];

          const maxPosterBytes =
            45 * 1024;

          const tryQuality = (
            index: number
          ) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(
                    new Error(
                      "Unable to compress poster image."
                    )
                  );
                  return;
                }

                // If the image is still too large at the final quality,
                // shrink the dimensions once more and retry.
                if (
                  blob.size > maxPosterBytes &&
                  index ===
                    qualities.length - 1 &&
                  canvas.width > 420
                ) {
                  const smaller =
                    document.createElement(
                      "canvas"
                    );

                  const smallerWidth =
                    Math.max(
                      420,
                      Math.round(
                        canvas.width * 0.72
                      )
                    );

                  const smallerHeight =
                    Math.max(
                      1,
                      Math.round(
                        canvas.height *
                          (smallerWidth /
                            canvas.width)
                      )
                    );

                  smaller.width =
                    smallerWidth;

                  smaller.height =
                    smallerHeight;

                  const smallerContext =
                    smaller.getContext("2d");

                  if (!smallerContext) {
                    reject(
                      new Error(
                        "Unable to resize poster image."
                      )
                    );
                    return;
                  }

                  smallerContext.drawImage(
                    canvas,
                    0,
                    0,
                    smallerWidth,
                    smallerHeight
                  );

                  canvas.width =
                    smallerWidth;
                  canvas.height =
                    smallerHeight;

                  context.drawImage(
                    smaller,
                    0,
                    0
                  );

                  tryQuality(0);
                  return;
                }

                const reader =
                  new FileReader();

                reader.onload = () =>
                  resolve(
                    String(
                      reader.result ?? ""
                    )
                  );

                reader.onerror = () =>
                  reject(
                    new Error(
                      "Unable to read compressed poster image."
                    )
                  );

                reader.readAsDataURL(
                  blob
                );
              },
              "image/webp",
              qualities[index]
            );
          };

          tryQuality(0);
        };

        image.onerror = () => {
          URL.revokeObjectURL(objectUrl);

          reject(
            new Error(
              "Unable to load poster image."
            )
          );
        };

        image.src = objectUrl;
      }
    );

  const handleFile = async (
    file?: File
  ) => {
    if (!file || uploading) return;

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Please choose an image file."
      );
      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      alert(
        "Poster image must be 10MB or smaller."
      );
      return;
    }

    try {
      setUploading(true);

      const compressedPoster =
        await compressPoster(file);

      onChange(compressedPoster);
    } catch (error) {
      console.error(
        "Poster processing error:",
        error
      );

      alert(
        "Unable to process this poster. Please try another image."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-field admin-poster-upload">
      <label>EVENT POSTER</label>

      <div className="poster-upload-box">
        <div className="poster-upload-preview">
          {value ? (
            <img
              src={value}
              alt="Event poster preview"
            />
          ) : (
            <div className="poster-upload-placeholder">
              <span>＋</span>
              <strong>
                UPLOAD POSTER
              </strong>
              <small>
                PNG, JPG or WEBP · AUTO OPTIMIZED
              </small>
            </div>
          )}
        </div>

        <div className="poster-upload-actions">
          <label
            className={`admin-upload-button ${
              uploading
                ? "is-uploading"
                : ""
            }`}
          >
            {uploading
              ? "OPTIMIZING POSTER..."
              : value
                ? "CHANGE POSTER"
                : "CHOOSE IMAGE"}

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={uploading}
              onChange={(event) => {
                void handleFile(
                  event.target.files?.[0]
                );

                // Selecting the same image again should still trigger.
                event.currentTarget.value =
                  "";
              }}
            />
          </label>

          {value && (
            <button
              type="button"
              className="admin-clear-button"
              disabled={uploading}
              onClick={() =>
                // Use null, not undefined. Firestore rejects undefined
                // values, while null is persisted and removes the poster
                // from the website after sync.
                onChange(null)
              }
            >
              REMOVE
            </button>
          )}
        </div>
      </div>

      <small className="admin-field-help">
        The poster is automatically optimized before saving so it
        reliably persists in Firebase and appears in EXPLORE EVENTS,
        event details and registration.
      </small>
    </div>
  );
}

function AdminInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
}) {
  return (
    <div className="admin-field">
      <label>{label}</label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />
    </div>
  );
}

function AdminTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div className="admin-field admin-field-full">
      <label>{label}</label>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        rows={4}
      />
    </div>
  );
}

function AdminSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: {
    label: string;
    value: string;
  }[];
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div className="admin-field">
      <label>{label}</label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      >
        {options.map(
          (option) => (
            <option
              key={option.value}
              value={
                option.value
              }
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </div>
  );
}

function AdminEmptyEvents({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <div className="admin-empty-state">
      <div>◆</div>

      <h2>
        NO EVENTS YET
      </h2>

      <p>
        Create your first event
        to start managing the
        symposium.
      </p>

      <button
        className="primary-button"
        onClick={onAdd}
      >
        + CREATE EVENT
      </button>
    </div>
  );
}

/* =========================================================
   PUBLIC SITE
========================================================= */

function PublicSite({
  onRegister,
  events,
  config,
}: {
  onRegister: (
    eventId?: string
  ) => void;
  events: EventItem[];
  config: SiteConfig;
}) {
  useEffect(() => {
    // Scroll reveal only: no content, layout, or existing UI is changed.
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(
        "main > .section, main > section.section, .footer"
      )
    );

    const childSelector = [
      ".section-heading",
      ".event-filter",
      ".event-card",
      ".about-copy",
      ".about-visual",
      ".people-card",
      ".team-card",
      ".contact-card",
      ".contact-row",
      ".footer-brand",
      ".footer-middle",
      ".footer-copy",
    ].join(",");

    const targets: HTMLElement[] = [];

    sections.forEach((section) => {
      section.classList.add("scroll-reveal-section");

      const children = Array.from(
        section.querySelectorAll<HTMLElement>(childSelector)
      );

      children.forEach((element, index) => {
        element.classList.add("scroll-reveal");
        element.style.setProperty(
          "--scroll-reveal-delay",
          `${Math.min(index * 70, 420)}ms`
        );
        targets.push(element);
      });
    });

    // If a section has no matching child, reveal the section itself.
    sections.forEach((section) => {
      const hasRevealChild = Array.from(
        section.querySelectorAll(".scroll-reveal")
      ).length > 0;

      if (!hasRevealChild) {
        section.classList.add("scroll-reveal");
        targets.push(section);
      }
    });

    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) =>
        target.classList.add("is-visible")
      );
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -7% 0px",
      }
    );

    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, [events, config]);

  const scrollToSection = (
    section: Section
  ) => {
    const element =
      document.getElementById(
        section
      );

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="app">
      <Navbar
        onSection={
          scrollToSection
        }
        onRegister={() =>
          onRegister()
        }
        config={config}
      />

      <main>
        <HeroSection
          config={config}
          onRegister={() =>
            onRegister()
          }
          onEvents={() =>
            scrollToSection(
              "events"
            )
          }
        />

        <EventsSection
          events={events}
          onRegister={(eventId) =>
            onRegister(
              eventId
            )
          }
        />

        <AboutSection
          config={config}
        />

        <PeopleSection
          config={config}
        />

        <ContactSection
          config={config}
        />
      </main>

      <Footer config={config} />
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [registrationOpen, setRegistrationOpen] =
    useState(false);

  const [registrationEventId, setRegistrationEventId] =
    useState<string | undefined>(
      undefined
    );

  const [path, setPath] =
    useState(
      window.location.pathname.toLowerCase()
    );

  const [events, setEvents] =
    useState<EventItem[]>(
      getStoredEvents()
    );

  const [config, setConfig] =
    useState<SiteConfig>(
      getStoredConfig()
    );

  const [adminAuthenticated, setAdminAuthenticated] =
    useState(false);

  useEffect(() => {
    const handlePopState =
      () => {
        setPath(
          window.location.pathname.toLowerCase()
        );
      };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

  useEffect(() => {
    const unsubscribeEvents = onSnapshot(
      doc(db, APP_STATE_TABLE, EVENTS_KEY),
      (snapshot) => {
        const value = snapshot.exists() ? snapshot.data().value : null;
        if (Array.isArray(value)) {
          void attachCloudPosters(value as EventItem[])
            .then((eventsWithPosters) => {
              setEvents(eventsWithPosters);
              saveEvents(eventsWithPosters);
            });
        }
      },
      (error) => console.error("Firebase public events listener error:", error)
    );

    const unsubscribeConfig = onSnapshot(
      doc(db, APP_STATE_TABLE, CONFIG_KEY),
      (snapshot) => {
        const value = snapshot.exists() ? snapshot.data().value : null;
        if (value && typeof value === "object") {
          const merged = { ...DEFAULT_CONFIG, ...(value as Partial<SiteConfig>) };
          setConfig(merged);
          saveConfig(merged);
        }
      },
      (error) => console.error("Firebase public config listener error:", error)
    );

    return () => {
      unsubscribeEvents();
      unsubscribeConfig();
    };
  }, []);

  useEffect(() => {
    const handleStorage =
      () => {
        setEvents(
          getStoredEvents()
        );

        setConfig(
          getStoredConfig()
        );
      };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  const openRegistration = (
    eventId?: string
  ) => {
    if (
      !config.registrationEnabled ||
      isRegistrationDeadlinePassed(
        config.registrationDeadline
      )
    ) {
      alert(
        "Registration is currently closed."
      );

      return;
    }

    setRegistrationEventId(
      eventId
    );

    setRegistrationOpen(
      true
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeRegistration =
    () => {
      setRegistrationOpen(
        false
      );

      setRegistrationEventId(
        undefined
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  const logoutAdmin = () => {
    localStorage.removeItem(
      "dynamoz26_admin_auth"
    );

    setAdminAuthenticated(
      false
    );
  };

  if (path === "/admin") {
    if (!adminAuthenticated) {
      return (
        <AdminLogin
          onLogin={() =>
            setAdminAuthenticated(
              true
            )
          }
        />
      );
    }

    return (
      <AdminPage
        onLogout={
          logoutAdmin
        }
      />
    );
  }

  if (registrationOpen) {
    return (
      <RegistrationPage
        events={events}
        config={config}
        initialEventId={
          registrationEventId
        }
        onBackHome={
          closeRegistration
        }
      />
    );
  }

  return (
    <PublicSite
      events={events}
      config={config}
      onRegister={
        openRegistration
      }
    />
  );
}
