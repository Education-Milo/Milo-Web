import { useColors } from "@shared/styles/themes/colors";
import React from "react";
import Typography from "./Typography.component";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import "../styles/MainButton.css";

interface MainButtonComponentProps {
	title: string;
	onPress: () => void;
	loading?: boolean;
	className?: string;
	icon?: React.ReactNode;
}

const MainButtonComponent = (props: MainButtonComponentProps) => {
	const { title, onPress, className, loading, icon } = props;
	const colors = useColors();

	return (
		<button
			className={cn("main-button", className)}
			onClick={onPress}
			disabled={loading}
		>
			<div className="main-button-inner">
				{loading ? (
					<Loader2 size={20} color="currentColor" className="animate-spin" />
				) : (
					<div className="main-button-inner">
						{icon && <div className="main-button-icon">{icon}</div>}
						<Typography variant="button" color={colors.white} className="main-button-label">
							{title}
						</Typography>
					</div>
				)}
			</div>
		</button>
	);
};

export default MainButtonComponent;
