// src/profile/types.ts
var e = () => ({
	id: "user_profile_default",
	personal: {
		firstName: "",
		middleName: "",
		lastName: "",
		fullName: "",
		legalFirstName: "",
		legalMiddleName: "",
		legalLastName: "",
		legalFullName: "",
		preferredName: "",
		previousNames: "",
		dateOfBirth: "",
		gender: "",
		nationality: "",
		country: "",
		address: "",
		city: "",
		state: "",
		postalCode: ""
	},
	contact: {
		primaryEmail: "",
		secondaryEmail: "",
		mobileNumber: "",
		phoneCountryCode: "+91",
		phoneNationalNumber: "",
		phoneFullInternational: "",
		alternatePhoneNumber: "",
		linkedInUrl: "",
		gitHubUrl: "",
		portfolioUrl: "",
		personalWebsite: ""
	},
	education: [],
	experience: [],
	skills: {
		programmingLanguages: [],
		frameworks: [],
		databases: [],
		cloudPlatforms: [],
		tools: [],
		softSkills: [],
		certifications: []
	},
	projects: [],
	additional: {
		noticePeriod: "",
		currentEmploymentStatus: "employed",
		expectedSalary: "",
		currentSalary: "",
		workAuthorization: "yes",
		requiresSponsorship: "no",
		willingnessToRelocate: !1,
		preferredWorkLocation: "",
		workModePreference: "hybrid",
		earliestStartDate: "",
		additionalNotes: ""
	},
	createdAt: (/* @__PURE__ */ new Date()).toISOString(),
	updatedAt: (/* @__PURE__ */ new Date()).toISOString()
}), t = {
	autoInspectForms: !0,
	highlightFilledFields: !0,
	saveNewMappingsByDefault: !1,
	showConfidenceScores: !0,
	theme: "light",
	telemetryEnabled: !1
}, n = {
	PROFILE: "applyonce_user_profile",
	CUSTOM_FIELDS: "applyonce_custom_fields",
	LEARNED_MAPPINGS: "applyonce_learned_mappings",
	APPLICATIONS: "applyonce_applications",
	SETTINGS: "applyonce_settings"
}, r = () => typeof chrome < "u" && !!chrome.storage && !!chrome.storage.local;
async function i(e, t) {
	if (r()) return new Promise((n) => {
		chrome.storage.local.get([e], (r) => {
			chrome.runtime.lastError || !r || r[e] === void 0 ? n(t) : n(r[e]);
		});
	});
	try {
		let n = localStorage.getItem(e);
		return n ? JSON.parse(n) : t;
	} catch {
		return t;
	}
}
async function a(e, t) {
	if (r()) return new Promise((n, r) => {
		chrome.storage.local.set({ [e]: t }, () => {
			chrome.runtime.lastError ? r(chrome.runtime.lastError) : n();
		});
	});
	try {
		localStorage.setItem(e, JSON.stringify(t));
	} catch (e) {
		console.warn("LocalStorage error:", e);
	}
}
var o = {
	async getProfile() {
		let t = await i(n.PROFILE, null);
		if (!t) {
			let t = e();
			return await a(n.PROFILE, t), t;
		}
		return t;
	},
	async saveProfile(e) {
		e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), await a(n.PROFILE, e);
	},
	async getCustomFields() {
		return await i(n.CUSTOM_FIELDS, []);
	},
	async saveCustomField(e) {
		let t = await this.getCustomFields(), r = t.findIndex((t) => t.id === e.id || t.fieldKey === e.fieldKey);
		r >= 0 ? t[r] = {
			...e,
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		} : t.push(e), await a(n.CUSTOM_FIELDS, t);
	},
	async saveMultipleCustomFields(e) {
		let t = await this.getCustomFields();
		for (let n of e) {
			let e = t.findIndex((e) => e.id === n.id || e.fieldKey === n.fieldKey);
			e >= 0 ? t[e] = {
				...n,
				updatedAt: (/* @__PURE__ */ new Date()).toISOString()
			} : t.push(n);
		}
		await a(n.CUSTOM_FIELDS, t);
	},
	async deleteCustomField(e) {
		let t = (await this.getCustomFields()).filter((t) => t.id !== e);
		await a(n.CUSTOM_FIELDS, t);
	},
	async getLearnedMappings() {
		return await i(n.LEARNED_MAPPINGS, []);
	},
	async saveLearnedMapping(e) {
		let t = await this.getLearnedMappings(), r = t.findIndex((t) => (t.websiteDomain === e.websiteDomain || t.websiteDomain === "*") && t.fieldSignature === e.fieldSignature);
		r >= 0 ? t[r] = {
			...t[r],
			...e,
			lastUsedAt: (/* @__PURE__ */ new Date()).toISOString(),
			usageCount: (t[r].usageCount || 1) + 1
		} : t.push(e), await a(n.LEARNED_MAPPINGS, t);
	},
	async deleteLearnedMapping(e) {
		let t = (await this.getLearnedMappings()).filter((t) => t.id !== e);
		await a(n.LEARNED_MAPPINGS, t);
	},
	async resetLearnedMappings() {
		await a(n.LEARNED_MAPPINGS, []);
	},
	async getApplications() {
		return await i(n.APPLICATIONS, []);
	},
	async saveApplication(e) {
		let t = await this.getApplications(), r = t.findIndex((t) => t.id === e.id);
		r >= 0 ? t[r] = {
			...e,
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		} : t.unshift(e), await a(n.APPLICATIONS, t);
	},
	async deleteApplication(e) {
		let t = (await this.getApplications()).filter((t) => t.id !== e);
		await a(n.APPLICATIONS, t);
	},
	async getSettings() {
		return await i(n.SETTINGS, t);
	},
	async saveSettings(e) {
		await a(n.SETTINGS, e);
	},
	async exportAllData() {
		let [e, t, n, r, i] = await Promise.all([
			this.getProfile(),
			this.getCustomFields(),
			this.getLearnedMappings(),
			this.getApplications(),
			this.getSettings()
		]);
		return JSON.stringify({
			version: "1.0.0",
			exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
			profile: e,
			customFields: t,
			learnedMappings: n,
			applications: r,
			settings: i
		}, null, 2);
	},
	async importAllData(e) {
		try {
			let t = JSON.parse(e);
			if (!t.profile || !t.profile.personal) throw Error("Invalid backup schema: missing profile personal data");
			return t.profile && await this.saveProfile(t.profile), Array.isArray(t.customFields) && await a(n.CUSTOM_FIELDS, t.customFields), Array.isArray(t.learnedMappings) && await a(n.LEARNED_MAPPINGS, t.learnedMappings), Array.isArray(t.applications) && await a(n.APPLICATIONS, t.applications), t.settings && await this.saveSettings(t.settings), !0;
		} catch (e) {
			return console.error("Import failed:", e), !1;
		}
	},
	async clearAllData() {
		r() ? await new Promise((e) => chrome.storage.local.clear(e)) : localStorage.clear();
	}
}, s = {
	INSPECT_PAGE_FORMS: "INSPECT_PAGE_FORMS",
	PAGE_FORMS_DETECTED: "PAGE_FORMS_DETECTED",
	TRIGGER_AUTOFILL: "TRIGGER_AUTOFILL",
	AUTOFILL_COMPLETED: "AUTOFILL_COMPLETED",
	AUTOFILL_STATUS: "AUTOFILL_STATUS",
	SAVE_CUSTOM_FIELDS: "SAVE_CUSTOM_FIELDS",
	SAVE_FIELD_MAPPING: "SAVE_FIELD_MAPPING",
	OPEN_DASHBOARD: "OPEN_DASHBOARD",
	GET_PROFILE_DATA: "GET_PROFILE_DATA"
};
console.log("ApplyOnce AI Background Service Worker initialized."), chrome.runtime.onInstalled.addListener(async (e) => {
	e.reason === "install" && (console.log("ApplyOnce AI installed for the first time."), await o.getProfile(), await o.getSettings(), chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") }));
}), chrome.runtime.onMessage.addListener((e, t, n) => {
	if (e && e.type) switch (e.type) {
		case s.OPEN_DASHBOARD:
			chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") }), n({ success: !0 });
			break;
		case s.GET_PROFILE_DATA: return Promise.all([
			o.getProfile(),
			o.getCustomFields(),
			o.getLearnedMappings(),
			o.getSettings()
		]).then(([e, t, r, i]) => {
			n({
				success: !0,
				profile: e,
				customFields: t,
				learnedMappings: r,
				settings: i
			});
		}).catch((e) => {
			n({
				success: !1,
				error: e.message
			});
		}), !0;
		case s.SAVE_CUSTOM_FIELDS:
			if (Array.isArray(e.payload)) return o.saveMultipleCustomFields(e.payload).then(() => n({ success: !0 })).catch((e) => n({
				success: !1,
				error: e.message
			})), !0;
			break;
		case s.SAVE_FIELD_MAPPING:
			if (e.payload) return o.saveLearnedMapping(e.payload).then(() => n({ success: !0 })).catch((e) => n({
				success: !1,
				error: e.message
			})), !0;
			break;
		case "UPDATE_BADGE_COUNT":
			if (t.tab?.id && typeof e.count == "number") {
				let n = e.count > 0 ? String(e.count) : "";
				chrome.action.setBadgeText({
					tabId: t.tab.id,
					text: n
				}), chrome.action.setBadgeBackgroundColor({
					tabId: t.tab.id,
					color: "#2563eb"
				});
			}
			n({ success: !0 });
	}
});
