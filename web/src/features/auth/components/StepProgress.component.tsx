import React from "react";
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
		<ol className="step-progress">
			{steps.map((step, index) => {
				const isCompleted = index < currentStep;
				const isActive = index === currentStep;
				return (
					<React.Fragment key={step.id}>
						<li className="step-item">
							<span
								className={`step-dot ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
							>
								{isCompleted ? (
									<Check size={12} strokeWidth={3} />
								) : (
									index + 1
								)}
							</span>
							<span
								className={`step-label ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
							>
								{step.label}
							</span>
						</li>
						{index < steps.length - 1 && (
							<li className="step-line" aria-hidden="true">
								<span
									className={`step-line-fill ${isCompleted ? "filled" : ""}`}
								/>
							</li>
						)}
					</React.Fragment>
				);
			})}
		</ol>
	);
};
