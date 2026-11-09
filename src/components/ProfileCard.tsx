import type { PersonalProfile } from '../lib/types';
import { PROFILE_LIMITS } from '../lib/types';
import { Field, InlineNote, SectionCard } from './Ui';

export interface ProfileCardProps {
  profile: PersonalProfile;
  onFieldChange: (field: keyof PersonalProfile, value: string) => void;
}

export function ProfileCard({ profile, onFieldChange }: ProfileCardProps) {
  return (
    <SectionCard
      id="profil"
      index="02"
      title="Persönliche Informationen"
      description="Diese Angaben bleiben in deinem Browser. Je konkreter sie sind, desto weniger muss die KI raten."
      action={<span className="hidden text-[10.5px] text-faint sm:inline">* Pflichtfeld</span>}
    >
      <InlineNote tone="info" icon="user" className="mb-5">
        <strong className="font-medium text-ink/90">Browser-Autofill:</strong> Name, Adresse und
        Kontaktdaten lassen sich mit den gespeicherten Browser-Daten ausfüllen. ApplyCraft
        speichert davon nichts.
      </InlineNote>

      <form autoComplete="on" onSubmit={(event) => event.preventDefault()} className="space-y-7">
        <fieldset>
          <legend className="eyebrow mb-3">Persönliche Daten</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vorname" htmlFor="profile-firstName" required>
              <input
                id="profile-firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                value={profile.firstName}
                onChange={(event) => onFieldChange('firstName', event.target.value)}
                className="input"
                placeholder="Anna"
                maxLength={PROFILE_LIMITS.firstName}
              />
            </Field>

            <Field label="Nachname" htmlFor="profile-lastName" required>
              <input
                id="profile-lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                value={profile.lastName}
                onChange={(event) => onFieldChange('lastName', event.target.value)}
                className="input"
                placeholder="Müller"
                maxLength={PROFILE_LIMITS.lastName}
              />
            </Field>

            <Field label="Adresse" htmlFor="profile-address" className="sm:col-span-2">
              <input
                id="profile-address"
                name="address"
                type="text"
                autoComplete="street-address"
                value={profile.address}
                onChange={(event) => onFieldChange('address', event.target.value)}
                className="input"
                placeholder="Musterstraße 12"
                maxLength={PROFILE_LIMITS.address}
              />
            </Field>

            <Field label="Postleitzahl" htmlFor="profile-postalCode">
              <input
                id="profile-postalCode"
                name="postalCode"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                value={profile.postalCode}
                onChange={(event) => onFieldChange('postalCode', event.target.value)}
                className="input"
                placeholder="80331"
                maxLength={PROFILE_LIMITS.postalCode}
              />
            </Field>

            <Field label="Stadt" htmlFor="profile-city">
              <input
                id="profile-city"
                name="city"
                type="text"
                autoComplete="address-level2"
                value={profile.city}
                onChange={(event) => onFieldChange('city', event.target.value)}
                className="input"
                placeholder="München"
                maxLength={PROFILE_LIMITS.city}
              />
            </Field>

            <Field label="E-Mail-Adresse" htmlFor="profile-email" required>
              <input
                id="profile-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={profile.email}
                onChange={(event) => onFieldChange('email', event.target.value)}
                className="input"
                placeholder="anna@example.de"
                spellCheck={false}
                maxLength={PROFILE_LIMITS.email}
              />
            </Field>

            <Field label="Telefonnummer" htmlFor="profile-phone">
              <input
                id="profile-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={profile.phone}
                onChange={(event) => onFieldChange('phone', event.target.value)}
                className="input"
                placeholder="+49 89 123456"
                maxLength={PROFILE_LIMITS.phone}
              />
            </Field>
          </div>
        </fieldset>

        <div className="h-px w-full bg-line/70" />

        <fieldset>
          <legend className="eyebrow mb-1.5">Beruf und Qualifikationen</legend>
          <p className="mb-4 text-[11.5px] leading-relaxed text-faint">
            Nenne nur Dinge, die tatsächlich stimmen. Die KI darf nichts ergänzen.
          </p>

          <div className="space-y-4">
            <Field label="Aktuelle Berufsbezeichnung" htmlFor="profile-currentRole">
              <input
                id="profile-currentRole"
                name="currentRole"
                type="text"
                autoComplete="organization-title"
                value={profile.currentRole}
                onChange={(event) => onFieldChange('currentRole', event.target.value)}
                className="input"
                placeholder="z. B. Senior Product Designerin"
                maxLength={PROFILE_LIMITS.currentRole}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Berufserfahrung"
                htmlFor="profile-experience"
                hint="Stationen, Aufgaben, Erfolge – gern mit Zeitraum."
                className="sm:col-span-2"
              >
                <textarea
                  id="profile-experience"
                  name="experience"
                  rows={4}
                  value={profile.experience}
                  onChange={(event) => onFieldChange('experience', event.target.value)}
                  className="textarea"
                  placeholder="Seit 2021 … Verantwortlich für …"
                  maxLength={PROFILE_LIMITS.experience}
                />
              </Field>

              <Field
                label="Frühere Arbeitgeber"
                htmlFor="profile-previousEmployers"
                className="sm:col-span-2"
              >
                <textarea
                  id="profile-previousEmployers"
                  name="previousEmployers"
                  rows={3}
                  value={profile.previousEmployers}
                  onChange={(event) => onFieldChange('previousEmployers', event.target.value)}
                  className="textarea"
                  placeholder="Unternehmen, Position, Zeitraum"
                  maxLength={PROFILE_LIMITS.previousEmployers}
                />
              </Field>

              <Field label="Ausbildung" htmlFor="profile-education">
                <textarea
                  id="profile-education"
                  name="education"
                  rows={3}
                  value={profile.education}
                  onChange={(event) => onFieldChange('education', event.target.value)}
                  className="textarea"
                  placeholder="Ausbildung, Abschluss, Jahr"
                  maxLength={PROFILE_LIMITS.education}
                />
              </Field>

              <Field label="Studium" htmlFor="profile-studies">
                <textarea
                  id="profile-studies"
                  name="studies"
                  rows={3}
                  value={profile.studies}
                  onChange={(event) => onFieldChange('studies', event.target.value)}
                  className="textarea"
                  placeholder="Studiengang, Hochschule, Abschluss"
                  maxLength={PROFILE_LIMITS.studies}
                />
              </Field>

              <Field
                label="Fähigkeiten und Kenntnisse"
                htmlFor="profile-skills"
                hint="Werkzeuge, Methoden, Fachkenntnisse."
              >
                <textarea
                  id="profile-skills"
                  name="skills"
                  rows={3}
                  value={profile.skills}
                  onChange={(event) => onFieldChange('skills', event.target.value)}
                  className="textarea"
                  placeholder="z. B. Figma, Design Systems, User Research"
                  maxLength={PROFILE_LIMITS.skills}
                />
              </Field>

              <Field label="Sprachkenntnisse" htmlFor="profile-languages">
                <textarea
                  id="profile-languages"
                  name="languages"
                  rows={3}
                  value={profile.languages}
                  onChange={(event) => onFieldChange('languages', event.target.value)}
                  className="textarea"
                  placeholder="z. B. Deutsch (Muttersprache), Englisch (C1)"
                  maxLength={PROFILE_LIMITS.languages}
                />
              </Field>

              <Field
                label="Weitere Qualifikationen"
                htmlFor="profile-extraQualifications"
                className="sm:col-span-2"
              >
                <textarea
                  id="profile-extraQualifications"
                  name="extraQualifications"
                  rows={3}
                  value={profile.extraQualifications}
                  onChange={(event) =>
                    onFieldChange('extraQualifications', event.target.value)
                  }
                  className="textarea"
                  placeholder="Zertifikate, Ehrenamt, Fortbildungen"
                  maxLength={PROFILE_LIMITS.extraQualifications}
                />
              </Field>
            </div>
          </div>
        </fieldset>
      </form>
    </SectionCard>
  );
}
