import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface ParentFaqCardProps {
	icon: string;
	q: string;
	a: string;
}

const ParentFaqCard: React.FC<ParentFaqCardProps> = ({ icon, q, a }) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<motion.div
			className={`faq-card-v4 ${isOpen ? "active" : ""}`}
			onClick={() => setIsOpen(!isOpen)}
			layout
		>
			<div className="faq-card-top">
				<div className="faq-icon-circle">{icon}</div>
				<h4>{q}</h4>
				<motion.div
					className="faq-chevron"
					animate={{ rotate: isOpen ? 180 : 0 }}
				>
					<ChevronDown size={20} />
				</motion.div>
			</div>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						className="faq-card-body"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
					>
						<p>{a}</p>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
};

export default ParentFaqCard;
