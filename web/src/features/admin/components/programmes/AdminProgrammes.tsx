import React, { useState } from "react";
import { FolderTree, Upload } from "lucide-react";
import CatalogueTree from "@features/admin/components/programmes/CatalogueTree";
import ProgrammeImport from "@features/admin/components/programmes/ProgrammeImport";
import RagDocuments from "@features/admin/components/programmes/RagDocuments";

type Tab = "catalogue" | "import";

/**
 * Programmes scolaires : catalogue (arbre éditable), import d'un programme
 * officiel, et base de connaissances (RAG) en bloc séparé.
 */
const AdminProgrammes: React.FC = () => {
	const [tab, setTab] = useState<Tab>("catalogue");

	return (
		<div className="ad-programmes">
			<section className="ad-card">
				<div className="ad-segmented" role="tablist" aria-label="Programmes">
					<button
						type="button"
						role="tab"
						aria-selected={tab === "catalogue"}
						className={`ad-segmented-btn ${tab === "catalogue" ? "active" : ""}`}
						onClick={() => setTab("catalogue")}
					>
						<FolderTree size={14} /> Catalogue
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={tab === "import"}
						className={`ad-segmented-btn ${tab === "import" ? "active" : ""}`}
						onClick={() => setTab("import")}
					>
						<Upload size={14} /> Importer un programme
					</button>
				</div>
				{tab === "catalogue" ? <CatalogueTree /> : <ProgrammeImport />}
			</section>

			<RagDocuments />
		</div>
	);
};

export default AdminProgrammes;
