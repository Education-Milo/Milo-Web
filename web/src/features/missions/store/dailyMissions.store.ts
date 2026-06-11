import { useCallback, useEffect, useState } from "react";
import type { DailyMission } from "@shared/types/missions";

const DAILY_MISSIONS_STORAGE_KEY = "milo_daily_missions_progress";

type DailyMissionId = "qcm-questions" | "qcm-correct" | "qcm-completed";

interface DailyMissionProgress {
	date: string;
	qcmQuestionsAnswered: number;
	qcmCorrectAnswers: number;
	qcmCompleted: number;
	recordedAttemptIds: string[];
}

interface QcmResult {
	attemptId: string;
	score: number;
	total: number;
}

const getTodayKey = () => {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const createEmptyProgress = (): DailyMissionProgress => ({
	date: getTodayKey(),
	qcmQuestionsAnswered: 0,
	qcmCorrectAnswers: 0,
	qcmCompleted: 0,
	recordedAttemptIds: [],
});

const readDailyMissionProgress = (): DailyMissionProgress => {
	if (typeof window === "undefined") {
		return createEmptyProgress();
	}

	const today = getTodayKey();
	const rawProgress = window.localStorage.getItem(DAILY_MISSIONS_STORAGE_KEY);

	if (!rawProgress) {
		return createEmptyProgress();
	}

	try {
		const progress = JSON.parse(rawProgress) as DailyMissionProgress;
		if (progress.date !== today) {
			return createEmptyProgress();
		}

		return {
			date: today,
			qcmQuestionsAnswered: Number(progress.qcmQuestionsAnswered) || 0,
			qcmCorrectAnswers: Number(progress.qcmCorrectAnswers) || 0,
			qcmCompleted: Number(progress.qcmCompleted) || 0,
			recordedAttemptIds: Array.isArray(progress.recordedAttemptIds)
				? progress.recordedAttemptIds
				: [],
		};
	} catch {
		return createEmptyProgress();
	}
};

const saveDailyMissionProgress = (progress: DailyMissionProgress) => {
	if (typeof window === "undefined") return;

	window.localStorage.setItem(
		DAILY_MISSIONS_STORAGE_KEY,
		JSON.stringify(progress),
	);
	window.dispatchEvent(new Event("daily-missions-updated"));
};

const clampProgress = (value: number, total: number) => Math.min(value, total);

export const getDailyMissions = (): DailyMission[] => {
	const progress = readDailyMissionProgress();

	return [
		{
			id: "qcm-questions",
			icon: "🎯",
			title: "Réponds à 5 questions de QCM",
			progressCurrent: clampProgress(progress.qcmQuestionsAnswered, 5),
			progressTotal: 5,
			rewardPoints: 30,
		},
		{
			id: "qcm-correct",
			icon: "✅",
			title: "Trouve 3 bonnes réponses",
			progressCurrent: clampProgress(progress.qcmCorrectAnswers, 3),
			progressTotal: 3,
			rewardPoints: 25,
		},
		{
			id: "qcm-completed",
			icon: "🏁",
			title: "Termine 1 QCM aujourd'hui",
			progressCurrent: clampProgress(progress.qcmCompleted, 1),
			progressTotal: 1,
			rewardPoints: 20,
		},
	];
};

export const recordQcmMissionProgress = ({
	attemptId,
	score,
	total,
}: QcmResult) => {
	const progress = readDailyMissionProgress();

	if (progress.recordedAttemptIds.includes(attemptId)) {
		return;
	}

	saveDailyMissionProgress({
		...progress,
		qcmQuestionsAnswered: progress.qcmQuestionsAnswered + Math.max(total, 0),
		qcmCorrectAnswers: progress.qcmCorrectAnswers + Math.max(score, 0),
		qcmCompleted: progress.qcmCompleted + 1,
		recordedAttemptIds: [...progress.recordedAttemptIds, attemptId],
	});
};

export const useDailyMissions = () => {
	const [missions, setMissions] = useState<DailyMission[]>(() =>
		getDailyMissions(),
	);

	const refreshMissions = useCallback(() => {
		setMissions(getDailyMissions());
	}, []);

	useEffect(() => {
		refreshMissions();
		window.addEventListener("storage", refreshMissions);
		window.addEventListener("daily-missions-updated", refreshMissions);

		return () => {
			window.removeEventListener("storage", refreshMissions);
			window.removeEventListener("daily-missions-updated", refreshMissions);
		};
	}, [refreshMissions]);

	return missions;
};

export type { DailyMissionId };
