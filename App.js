import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import events from "./events";

const COLORS = {
  blue: "#193579",
  deepBlue: "#12265d",
  purple: "#7055ad",
  lightPurple: "#f0ecf8",
  background: "#f5f6fb",
  white: "#ffffff",
  ink: "#202b49",
  muted: "#68738c",
  border: "#e1e5ef",
  green: "#237454",
  red: "#b23a48",
};

const TABS = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "events", label: "Events", icon: "▦" },
  { id: "saved", label: "Saved", icon: "♡" },
  { id: "registrations", label: "Registrations", icon: "▤" },
];

const STORAGE_KEYS = {
  saved: "csi-saved-events",
  registrations: "csi-registrations",
};

function ActionButton({ label, onPress, secondary = false, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary ? styles.secondaryButton : styles.primaryButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressedButton,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SectionTitle({ eyebrow, title, action, onAction }) {
  return (
    <View style={styles.sectionHeading}>
      <View>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onAction}>
          <Text style={styles.textLink}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function EventCard({ event, saved, registered, onOpen, onToggleSaved }) {
  return (
    <View style={styles.eventCard}>
      <View style={styles.eventCardTop}>
        <Text style={styles.category}>{event.category}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? `Remove ${event.name} from saved events` : `Save ${event.name}`}
          onPress={onToggleSaved}
          style={styles.saveButton}
        >
          <Text style={[styles.saveIcon, saved && styles.savedIcon]}>
            {saved ? "♥" : "♡"}
          </Text>
        </Pressable>
      </View>
      <Text style={styles.eventName}>{event.name}</Text>
      <Text style={styles.eventDescription} numberOfLines={2}>
        {event.description}
      </Text>
      <View style={styles.eventMeta}>
        <Text style={styles.metaText}>◷  {event.date} · {event.time}</Text>
        <Text style={styles.metaText}>⌖  {event.venue}</Text>
      </View>
      <View style={styles.cardBottom}>
        {registered ? (
          <Text style={styles.registeredLabel}>Registered</Text>
        ) : (
          <View />
        )}
        <Pressable accessibilityRole="button" onPress={onOpen}>
          <Text style={styles.textLink}>View details  →</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType, error }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
        autoCorrect={keyboardType !== "email-address"}
        keyboardType={keyboardType || "default"}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#98a0b2"
        style={[styles.input, error && styles.inputError]}
        value={value}
      />
    </View>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registeringEvent, setRegisteringEvent] = useState(null);
  const [query, setQuery] = useState("");
  const [savedIds, setSavedIds] = useState([]);
  const [registrations, setRegistrations] = useState({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
  });
  const [errors, setErrors] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function loadSavedData() {
      try {
        const [savedValue, registrationsValue] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.saved),
          AsyncStorage.getItem(STORAGE_KEYS.registrations),
        ]);
        if (savedValue) {
          const parsed = JSON.parse(savedValue);
          if (Array.isArray(parsed)) setSavedIds(parsed);
        }
        if (registrationsValue) {
          const parsed = JSON.parse(registrationsValue);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            setRegistrations(parsed);
          }
        }
      } catch (error) {
        Alert.alert("Saved data unavailable", "Your saved events and registrations could not be loaded.");
      } finally {
        setReady(true);
      }
    }
    loadSavedData();
  }, []);

  async function persist(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      Alert.alert("Could not save changes", "Please check your device storage and try again.");
    }
  }

  function toggleSaved(event) {
    const next = savedIds.includes(event.id)
      ? savedIds.filter((id) => id !== event.id)
      : [...savedIds, event.id];
    setSavedIds(next);
    persist(STORAGE_KEYS.saved, next);
  }

  function openEvent(event) {
    setSelectedEvent(event);
    setRegisteringEvent(null);
  }

  function openRegistration(event) {
    if (registrations[event.id]) {
      Alert.alert("Already registered", "You have already registered for this event.");
      return;
    }
    setForm({ name: "", email: "", phone: "", college: "" });
    setErrors({});
    setRegisteringEvent(event);
  }

  function submitRegistration() {
    const nextErrors = {};
    Object.entries(form).forEach(([field, value]) => {
      if (!value.trim()) nextErrors[field] = "Required";
    });
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }
    if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 10) {
      nextErrors.phone = "Enter a valid phone number";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (registrations[registeringEvent.id]) {
      Alert.alert("Already registered", "You have already registered for this event.");
      setRegisteringEvent(null);
      return;
    }

    const next = {
      ...registrations,
      [registeringEvent.id]: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        college: form.college.trim(),
      },
    };
    setRegistrations(next);
    persist(STORAGE_KEYS.registrations, next);
    setRegisteringEvent(null);
    Alert.alert("Registration complete", `You are registered for ${registeringEvent.name}.`);
  }

  function renderEventList(list) {
    if (list.length === 0) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>✦</Text>
          <Text style={styles.emptyText}>
            {tab === "saved"
              ? "No saved events yet."
              : tab === "registrations"
                ? "You have not registered for any event yet."
                : "No events match your search."}
          </Text>
        </View>
      );
    }
    return list.map((event) => (
      <EventCard
        key={event.id}
        event={event}
        saved={savedIds.includes(event.id)}
        registered={Boolean(registrations[event.id])}
        onOpen={() => openEvent(event)}
        onToggleSaved={() => toggleSaved(event)}
      />
    ));
  }

  function renderHome() {
    const featured = events[0];
    return (
      <>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <Image source={require("./assets/csi-logo.png")} style={styles.heroLogo} />
            <View>
              <Text style={styles.heroEyebrow}>CSI AITR STUDENT CHAPTER</Text>
              <Text style={styles.heroTitle}>Event Companion</Text>
            </View>
          </View>
          <Text style={styles.heroSubtitle}>
            Discover events, register easily, and stay connected.
          </Text>
          <View style={styles.featuredCard}>
            <Text style={styles.featuredEyebrow}>FEATURED EVENT</Text>
            <Text style={styles.featuredTitle}>{featured.name}</Text>
            <Text style={styles.featuredTheme}>{featured.theme}</Text>
            <Text style={styles.featuredMeta}>{featured.date}  ·  {featured.venue}</Text>
            <ActionButton label="View Event" onPress={() => openEvent(featured)} />
          </View>
          <View style={styles.instituteRow}>
            <Image source={require("./assets/aitr-logo.png")} style={styles.instituteLogo} />
            <Text style={styles.instituteText}>Acropolis Institute of Technology and Research</Text>
          </View>
        </View>
        <View style={styles.section}>
          <SectionTitle
            eyebrow="MARK YOUR CALENDAR"
            title="Upcoming Events"
            action="See all"
            onAction={() => setTab("events")}
          />
          {events.slice(0, 3).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              saved={savedIds.includes(event.id)}
              registered={Boolean(registrations[event.id])}
              onOpen={() => openEvent(event)}
              onToggleSaved={() => toggleSaved(event)}
            />
          ))}
        </View>
      </>
    );
  }

  function renderEvents() {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = events.filter((event) =>
      [event.name, event.venue, event.category, event.description]
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
    return (
      <View style={styles.page}>
        <SectionTitle eyebrow="FIND YOUR NEXT EXPERIENCE" title="All Events" />
        <TextInput
          accessibilityLabel="Search events"
          onChangeText={setQuery}
          placeholder="Search events, venues, categories..."
          placeholderTextColor="#98a0b2"
          style={styles.searchInput}
          value={query}
        />
        <Text style={styles.resultCount}>
          {filtered.length} {filtered.length === 1 ? "event" : "events"}
        </Text>
        {renderEventList(filtered)}
      </View>
    );
  }

  function renderSaved() {
    return (
      <View style={styles.page}>
        <SectionTitle eyebrow="YOUR BOOKMARKS" title="Saved Events" />
        {renderEventList(events.filter((event) => savedIds.includes(event.id)))}
      </View>
    );
  }

  function renderRegistrations() {
    return (
      <View style={styles.page}>
        <SectionTitle eyebrow="YOUR EVENT PLANS" title="My Registrations" />
        {renderEventList(events.filter((event) => registrations[event.id]))}
      </View>
    );
  }

  function renderDetails() {
    const event = selectedEvent;
    const registered = Boolean(registrations[event.id]);
    return (
      <View style={styles.page}>
        <Pressable accessibilityRole="button" onPress={() => setSelectedEvent(null)} style={styles.backButton}>
          <Text style={styles.backText}>‹  Back to {tab === "home" ? "Home" : tab === "saved" ? "Saved" : tab === "registrations" ? "Registrations" : "Events"}</Text>
        </Pressable>
        <View style={styles.detailBanner}>
          <Text style={styles.featuredEyebrow}>CSI AITR · EVENT</Text>
          <Text style={styles.detailTitle}>{event.name}</Text>
          <Text style={styles.featuredTheme}>{event.theme}</Text>
        </View>
        <View style={styles.detailCard}>
          <SectionTitle eyebrow="EVENT INFORMATION" title="The details" />
          <DetailRow label="Date" value={event.date} />
          <DetailRow label="Time" value={event.time} />
          <DetailRow label="Venue" value={event.venue} />
          <DetailRow label="Category" value={event.category} />
          <DetailRow label="Organizer" value={event.organizer} />
          <View style={styles.descriptionBlock}>
            <Text style={styles.detailLabel}>About this event</Text>
            <Text style={styles.detailDescription}>{event.description}</Text>
          </View>
          <View style={styles.descriptionBlock}>
            <Text style={styles.detailLabel}>What to expect</Text>
            <Text style={styles.detailDescription}>{event.details}</Text>
          </View>
        </View>
        <View style={styles.detailActions}>
          <ActionButton
            label={registered ? "Registered" : "Register Now"}
            onPress={() => openRegistration(event)}
            disabled={registered}
          />
          <ActionButton
            label={savedIds.includes(event.id) ? "♥  Saved — tap to remove" : "♡  Save Event"}
            secondary
            onPress={() => toggleSaved(event)}
          />
        </View>
      </View>
    );
  }

  function renderRegistration() {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.page}>
          <Pressable accessibilityRole="button" onPress={() => setRegisteringEvent(null)} style={styles.backButton}>
            <Text style={styles.backText}>‹  Back to event</Text>
          </Pressable>
          <View style={styles.formCard}>
            <Text style={styles.eyebrow}>EVENT REGISTRATION</Text>
            <Text style={styles.formTitle}>Join the event</Text>
            <Text style={styles.formSubtitle}>{registeringEvent.name}</Text>
            <Field
              label="Name"
              placeholder="Your full name"
              value={form.name}
              onChangeText={(name) => setForm({ ...form, name })}
              error={errors.name}
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            <Field
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(email) => setForm({ ...form, email })}
              error={errors.email}
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            <Field
              label="Phone Number"
              placeholder="10-digit phone number"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(phone) => setForm({ ...form, phone })}
              error={errors.phone}
            />
            {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
            <Field
              label="College / Branch"
              placeholder="e.g. AITR / Computer Science"
              value={form.college}
              onChangeText={(college) => setForm({ ...form, college })}
              error={errors.college}
            />
            {errors.college ? <Text style={styles.errorText}>{errors.college}</Text> : null}
            <ActionButton label="Submit Registration" onPress={submitRegistration} />
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  let content;
  if (registeringEvent) content = renderRegistration();
  else if (selectedEvent) content = renderDetails();
  else if (tab === "events") content = renderEvents();
  else if (tab === "saved") content = renderSaved();
  else if (tab === "registrations") content = renderRegistrations();
  else content = renderHome();

  if (!ready) {
    return (
      <SafeAreaView style={styles.loading}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <Image source={require("./assets/csi-logo.png")} style={styles.loadingLogo} />
        <Text style={styles.loadingText}>CSI Event Companion</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.header}>
        <Image source={require("./assets/csi-logo.png")} style={styles.headerLogo} />
        <View style={styles.headerCopy}>
          <Text style={styles.headerBrand}>CSI AITR</Text>
          <Text style={styles.headerSubtitle}>Student Chapter</Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
      {!selectedEvent && !registeringEvent ? (
        <View style={styles.tabBar}>
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setTab(item.id)}
                style={styles.tabItem}
              >
                <Text style={[styles.tabIcon, active && styles.activeTabText]}>{item.icon}</Text>
                <Text numberOfLines={1} style={[styles.tabLabel, active && styles.activeTabText]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background },
  loadingLogo: { width: 72, height: 72, resizeMode: "contain" },
  loadingText: { marginTop: 12, color: COLORS.deepBlue, fontSize: 17, fontWeight: "700" },
  header: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLogo: { width: 42, height: 42, resizeMode: "contain", marginRight: 11 },
  headerCopy: { justifyContent: "center" },
  headerBrand: { color: COLORS.blue, fontSize: 16, fontWeight: "800" },
  headerSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  scrollContent: { paddingBottom: 26 },
  hero: { padding: 20, backgroundColor: "#e9eef9" },
  brandRow: { flexDirection: "row", alignItems: "center" },
  heroLogo: { width: 58, height: 58, resizeMode: "contain", marginRight: 13 },
  heroEyebrow: { color: COLORS.purple, fontWeight: "800", fontSize: 10, letterSpacing: 1 },
  heroTitle: { color: COLORS.deepBlue, fontWeight: "800", fontSize: 21, marginTop: 3 },
  heroSubtitle: { color: "#546483", fontSize: 14, lineHeight: 21, marginTop: 15, marginBottom: 17 },
  featuredCard: {
    backgroundColor: COLORS.deepBlue,
    borderRadius: 14,
    padding: 18,
    shadowColor: COLORS.deepBlue,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  featuredEyebrow: { color: "#c8baf2", fontWeight: "800", fontSize: 10, letterSpacing: 1.4 },
  featuredTitle: { color: COLORS.white, fontSize: 24, fontWeight: "800", marginTop: 10 },
  featuredTheme: { color: "#ded7f4", fontSize: 13, marginTop: 4 },
  featuredMeta: { color: "#eef0f8", fontSize: 12, marginTop: 14, marginBottom: 17 },
  instituteRow: { flexDirection: "row", alignItems: "center", marginTop: 17 },
  instituteLogo: { width: 42, height: 42, resizeMode: "contain", marginRight: 10 },
  instituteText: { color: COLORS.muted, fontSize: 11, flex: 1 },
  section: { paddingHorizontal: 18, paddingTop: 23 },
  page: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 20 },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 17 },
  eyebrow: { color: COLORS.purple, fontWeight: "800", fontSize: 10, letterSpacing: 1.3, marginBottom: 5 },
  sectionTitle: { color: COLORS.deepBlue, fontSize: 22, fontWeight: "800" },
  textLink: { color: COLORS.blue, fontSize: 13, fontWeight: "700" },
  eventCard: {
    backgroundColor: COLORS.white,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 13,
    shadowColor: COLORS.deepBlue,
    shadowOpacity: 0.05,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  eventCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  category: { overflow: "hidden", color: COLORS.purple, backgroundColor: COLORS.lightPurple, fontSize: 10, fontWeight: "800", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  saveButton: { minWidth: 35, minHeight: 35, alignItems: "center", justifyContent: "center" },
  saveIcon: { color: COLORS.muted, fontSize: 24, lineHeight: 28 },
  savedIcon: { color: COLORS.purple },
  eventName: { color: COLORS.ink, fontWeight: "800", fontSize: 18, marginTop: 9 },
  eventDescription: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  eventMeta: { marginTop: 12, gap: 5 },
  metaText: { color: "#53607c", fontSize: 11, lineHeight: 16 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 11, marginTop: 12 },
  registeredLabel: { color: COLORS.green, fontSize: 11, fontWeight: "800" },
  searchInput: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.ink, fontSize: 14 },
  resultCount: { color: COLORS.muted, fontSize: 12, marginTop: 14, marginBottom: 12 },
  emptyCard: { alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderWidth: 1, borderRadius: 13, padding: 30, marginTop: 4 },
  emptyIcon: { color: COLORS.purple, fontSize: 28, marginBottom: 8 },
  emptyText: { color: COLORS.muted, fontSize: 14, textAlign: "center" },
  backButton: { alignSelf: "flex-start", paddingVertical: 6, marginBottom: 12 },
  backText: { color: COLORS.blue, fontWeight: "700", fontSize: 14 },
  detailBanner: { backgroundColor: COLORS.deepBlue, borderRadius: 14, padding: 20, marginBottom: 15 },
  detailTitle: { color: COLORS.white, fontWeight: "800", fontSize: 27, marginTop: 10 },
  detailCard: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderWidth: 1, borderRadius: 13, padding: 17 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailLabel: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  detailValue: { color: COLORS.ink, fontSize: 12, textAlign: "right", flexShrink: 1 },
  descriptionBlock: { marginTop: 15 },
  detailDescription: { color: COLORS.muted, fontSize: 13, lineHeight: 20, marginTop: 5 },
  detailActions: { gap: 10, marginTop: 15 },
  button: { minHeight: 46, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingVertical: 12 },
  primaryButton: { backgroundColor: COLORS.blue },
  secondaryButton: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  buttonText: { color: COLORS.white, fontWeight: "800", fontSize: 14 },
  secondaryButtonText: { color: COLORS.blue },
  disabledButton: { backgroundColor: "#8d98b0" },
  pressedButton: { opacity: 0.82 },
  formCard: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 13, padding: 18 },
  formTitle: { color: COLORS.deepBlue, fontWeight: "800", fontSize: 24, marginTop: 3 },
  formSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 5, marginBottom: 17 },
  field: { marginBottom: 12 },
  fieldLabel: { color: COLORS.ink, fontSize: 12, fontWeight: "700", marginBottom: 6 },
  input: { minHeight: 46, borderWidth: 1, borderColor: "#cfd6e4", borderRadius: 8, paddingHorizontal: 12, color: COLORS.ink, fontSize: 14 },
  inputError: { borderColor: COLORS.red },
  errorText: { color: COLORS.red, fontSize: 11, marginTop: -8, marginBottom: 10 },
  tabBar: { minHeight: 64, flexDirection: "row", justifyContent: "space-around", alignItems: "center", backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: 5 },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 7 },
  tabIcon: { color: COLORS.muted, fontSize: 20, lineHeight: 23 },
  tabLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "600", marginTop: 2 },
  activeTabText: { color: COLORS.purple, fontWeight: "800" },
});
