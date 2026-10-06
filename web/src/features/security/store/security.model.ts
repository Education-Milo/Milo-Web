/** GET /2fa/status */
export interface TwoFactorStatus {
	totp_enabled: boolean;
	/** Configuration TOTP commencée (setup) mais pas encore confirmée */
	totp_pending: boolean;
	email_enabled: boolean;
	recovery_codes_remaining: number;
	trusted_devices_count: number;
}

/** POST /2fa/totp/setup — `secret` valable 10 minutes, actif après confirm */
export interface TotpSetupResponse {
	secret: string;
	otpauth_uri: string;
	expires_in: number;
}

/**
 * POST /2fa/totp/confirm et /2fa/email/confirm. `recovery_codes` n'est
 * présent qu'à l'activation du PREMIER facteur : la clé est alors absente
 * (pas null) dans les autres cas, toujours tester sa présence.
 */
export interface FactorConfirmResponse {
	message: string;
	recovery_codes?: string[];
}

export interface RecoveryCodesResponse {
	recovery_codes: string[];
}

/** Identité exigée pour retirer un facteur : mot de passe ET code */
export interface DisableFactorPayload {
	current_password: string;
	/** Code TOTP, code reçu par email ou code de secours */
	code: string;
}

export interface TrustedDevice {
	id: number;
	device_name: string | null;
	user_agent: string | null;
	ip_address: string | null;
	created_at: string;
	last_used_at: string | null;
	expires_at: string;
}

export interface UserSession extends TrustedDevice {
	/** Renseigné en mode cookie uniquement ; sinon null */
	is_current: boolean | null;
}

export type SecondFactor = "totp" | "email";
