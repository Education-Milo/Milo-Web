import React, { useMemo } from "react";
import DistressText from "@shared/components/DistressText.component";
import { isDistressReply } from "@shared/lib/distress";
import { BOX_EMOJI, parseBoardText, type BoardBlock } from "@features/milo-scene/utils/lessonText";
import InlineText from "@features/milo-scene/components/InlineText.component";

/// Réponse de Milo écrite au tableau, avec la même mise en forme que le cours
/// (encadrés, mots clés, nombres), sans HTML injecté. Une réponse de détresse
/// garde ses numéros d'aide cliquables.
const RichText: React.FC<{ text: string; className?: string }> = ({ text, className = "cls-rich" }) => {
	const nodes = useMemo(() => parseBoardText(text), [text]);

	if (isDistressReply(text)) {
		return (
			<div className={className}>
				<p>
					<DistressText text={text} />
				</p>
			</div>
		);
	}

	const renderBlock = (block: BoardBlock, key: React.Key) => {
		if (block.kind === "spacer") return <span key={key} className="cls-rich-gap" />;
		const Tag = block.kind === "heading" ? "h3" : "p";
		return (
			<Tag key={key} className={`cls-board-block cls-board-block--${block.kind}`}>
				{block.marker && (
					<span className="cls-board-marker" aria-hidden="true">
						{block.marker === "•" ? "" : block.marker}
					</span>
				)}
				<span>
					{block.sentences.map((sentence) => (
						<InlineText key={sentence.index} text={sentence.text} />
					))}
				</span>
			</Tag>
		);
	};

	return (
		<div className={className}>
			{nodes.map((node, i) =>
				node.kind === "box" ? (
					<section key={i} className={`cls-board-box cls-board-box--${node.variant}`}>
						<span className="cls-board-box-label">
							<img src={`/landing/emoji/${BOX_EMOJI[node.variant]}.webp`} alt="" aria-hidden="true" />
							{node.title}
						</span>
						{node.blocks.map(renderBlock)}
					</section>
				) : (
					renderBlock(node, i)
				),
			)}
		</div>
	);
};

export default RichText;
