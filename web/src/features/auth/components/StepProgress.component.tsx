import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import "@features/auth/styles/StepProgress.css";

export interface Step {
	id: string;
	label: string;
}

interface StepProgressProps {
	steps: Step[];
	currentStep: number;
}

export const StepProgress: React.FC<StepProgressProps> = ({
	steps,
	currentStep,
}) => {
	return (
		<div className="step-progress">
			{steps.map((step, index) => {
				const isCompleted = index < currentStep;
				const isActive = index === currentStep;
				return (
					<React.Fragment key={step.id}>
						<div className="step-item">
							<div
								className={`step-dot ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
							>
								{isCompleted ? (
									<Check size={14} strokeWidth={3} />
								) : (
									<span>{index + 1}</span>
								)}
							</div>
							<span
								className={`step-label ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
							>
								{step.label}
							</span>
						</div>
						{index < steps.length - 1 && (
							<div className="step-line">
								<motion.div
									className="step-line-fill"
									initial={{ width: 0 }}
									animate={{ width: isCompleted ? "100%" : "0%" }}
									transition={{ duration: 0.4, ease: "easeInOut" }}
								/>
							</div>
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
};
