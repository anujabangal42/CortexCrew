(() => {
  const form = document.getElementById("analysis-form");
  const vcfInput = document.getElementById("vcf_file");
  const dropzone = document.getElementById("dropzone");
  const browseBtn = document.getElementById("browse-btn");
  const fileInfo = document.getElementById("file-info");
  const errorBox = document.getElementById("error-box");
  const analyzeBtn = document.getElementById("analyze-btn");
  const resultsPlaceholder = document.getElementById("results-placeholder");
  const resultsContainer = document.getElementById("results-container");
  const copyJsonBtn = document.getElementById("copy-json-btn");

  let lastJson = null;

  const setLoading = (loading) => {
    analyzeBtn.disabled = loading;
    analyzeBtn.textContent = loading ? "Analyzing..." : "Analyze Pharmacogenomic Risk";
  };

  const showError = (msg) => {
    errorBox.textContent = msg;
    errorBox.classList.remove("d-none");
  };

  const clearError = () => {
    errorBox.textContent = "";
    errorBox.classList.add("d-none");
  };

  const prettyJson = (obj) => JSON.stringify(obj, null, 2);

  const riskClass = (label) => {
    if (!label) return "risk-unknown";
    const v = label.toLowerCase();
    if (v === "safe") return "risk-safe";
    if (v.startsWith("adjust")) return "risk-adjust";
    if (v === "toxic" || v === "ineffective") return "risk-toxic";
    return "risk-unknown";
  };

  const renderResults = (payload) => {
    if (!payload || !Array.isArray(payload.results) || payload.results.length === 0) {
      resultsPlaceholder.textContent = "No results were generated.";
      resultsPlaceholder.classList.remove("d-none");
      resultsContainer.classList.add("d-none");
      copyJsonBtn.disabled = true;
      lastJson = null;
      return;
    }

    lastJson = payload.results;
    copyJsonBtn.disabled = false;
    const downloadBtn = document.getElementById("download-json-btn");
    if (downloadBtn) downloadBtn.disabled = false;

    resultsPlaceholder.classList.add("d-none");
    resultsContainer.classList.remove("d-none");

    const unsupported = payload.unsupported_drugs || [];

    const pieces = [];

    if (unsupported.length > 0) {
      pieces.push(
        `<div class="alert alert-warning small">Unsupported drugs ignored: ${unsupported.join(
          ", "
        )}</div>`
      );
    }

    payload.results.forEach((r, idx) => {
      const ra = r.risk_assessment || {};
      const prof = r.pharmacogenomic_profile || {};
      const expl = r.llm_generated_explanation || {};
      const qual = r.quality_metrics || {};

      pieces.push(`
        <div class="accordion mb-2" id="result-acc-${idx}">
          <div class="accordion-item">
            <h2 class="accordion-header" id="heading-${idx}">
              <button class="accordion-button collapsed" type="button"
                data-bs-toggle="collapse" data-bs-target="#collapse-${idx}"
                aria-expanded="false" aria-controls="collapse-${idx}">
                <div class="d-flex flex-column flex-md-row w-100 justify-content-between align-items-md-center gap-2">
                  <div>
                    <span class="fw-semibold">${r.drug}</span>
                    <span class="text-muted small ms-1">patient: ${r.patient_id}</span>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <span class="risk-badge ${riskClass(
                      ra.risk_label
                    )}">${ra.risk_label || "Unknown"}</span>
                    <span class="severity-chip text-uppercase small">${ra.severity || "none"}</span>
                    <span class="text-muted small">confidence: ${(
                      (ra.confidence_score || 0) * 100
                    ).toFixed(0)}%</span>
                  </div>
                </div>
              </button>
            </h2>
            <div id="collapse-${idx}" class="accordion-collapse collapse" aria-labelledby="heading-${idx}">
              <div class="accordion-body">
                <div class="mb-2">
                  <div class="fw-semibold mb-1">Clinical recommendation</div>
                  <p class="mb-1">${(r.clinical_recommendation || {}).dosing_recommendation || ""}</p>
                  <p class="text-muted small mb-0">${
                    (r.clinical_recommendation || {}).guideline_source || ""
                  }</p>
                </div>

                <hr />

                <div class="row mb-2">
                  <div class="col-md-6">
                    <div class="fw-semibold mb-1">Pharmacogenomic profile</div>
                    <ul class="small mb-2">
                      <li><strong>Gene</strong>: ${prof.primary_gene || "N/A"}</li>
                      <li><strong>Diplotype</strong>: ${prof.diplotype || "N/A"}</li>
                      <li><strong>Phenotype</strong>: ${prof.phenotype || "Unknown"}</li>
                      <li><strong>Variant count</strong>: ${
                        (prof.detected_variants || []).length
                      }</li>
                    </ul>
                  </div>
                  <div class="col-md-6">
                    <div class="fw-semibold mb-1">LLM explanation</div>
                    <p class="small mb-1">${expl.summary || ""}</p>
                    <p class="small text-muted mb-1">${expl.mechanism || ""}</p>
                    ${
                      (expl.citations || []).length
                        ? `<p class="small mb-0"><strong>Citations</strong>: ${(expl.citations || []).join(
                            "; "
                          )}</p>`
                        : ""
                    }
                    ${
                      expl.limitations
                        ? `<p class="small text-muted mb-0"><strong>Limitations</strong>: ${
                            expl.limitations
                          }</p>`
                        : ""
                    }
                  </div>
                </div>

                <details class="mb-2">
                  <summary class="small fw-semibold">Detected variants</summary>
                  <pre class="json-block mt-2">${prettyJson(
                    prof.detected_variants || []
                  )}</pre>
                </details>

                <details>
                  <summary class="small fw-semibold">Full JSON payload</summary>
                  <pre class="json-block mt-2">${prettyJson(r)}</pre>
                </details>

                <div class="mt-2 small text-muted">
                  VCF parsed: ${qual.vcf_parsing_success ? "yes" : "no"} |
                  total variants: ${qual.variant_count || 0} |
                  genes covered: ${(qual.genes_covered || []).join(", ") || "n/a"}
                </div>
              </div>
            </div>
          </div>
        </div>
      `);
    });

    resultsContainer.innerHTML = pieces.join("");
  };

  // Drag & drop setup
  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("border-primary", "bg-light");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("border-primary", "bg-light");
    });
  });

  dropzone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const file = dt && dt.files && dt.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".vcf")) {
      showError("Invalid file type. Please drop a .vcf file.");
      return;
    }
    vcfInput.files = dt.files;
    fileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} kB)`;
    clearError();
  });

  browseBtn.addEventListener("click", () => vcfInput.click());

  vcfInput.addEventListener("change", () => {
    const file = vcfInput.files[0];
    if (!file) {
      fileInfo.textContent = "";
      return;
    }
    if (!file.name.toLowerCase().endsWith(".vcf")) {
      showError("Invalid file type. Please upload a .vcf file.");
      vcfInput.value = "";
      fileInfo.textContent = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError("VCF file is too large (limit 5 MB).");
      vcfInput.value = "";
      fileInfo.textContent = "";
      return;
    }
    clearError();
    fileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} kB)`;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    if (!vcfInput.files || !vcfInput.files[0]) {
      showError("Please upload a VCF file first.");
      return;
    }

    const drugsVal = document.getElementById("drug_input").value.trim();
    if (!drugsVal) {
      showError("Please enter at least one drug name.");
      return;
    }

    const formData = new FormData();
    formData.append("vcf_file", vcfInput.files[0]);
    formData.append("drugs", drugsVal);

    setLoading(true);

    try {
      const res = await fetch("/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Analysis failed.");
        return;
      }

      renderResults(data);
    } catch (err) {
      console.error(err);
      showError("Network or server error during analysis.");
    } finally {
      setLoading(false);
    }
  });

  copyJsonBtn.addEventListener("click", async () => {
    if (!lastJson) return;
    try {
      await navigator.clipboard.writeText(prettyJson(lastJson));
      copyJsonBtn.textContent = "Copied!";
      setTimeout(() => {
        copyJsonBtn.textContent = "Copy JSON";
      }, 1500);
    } catch {
      showError("Unable to copy to clipboard.");
    }
  });

  // Optional: downloadable JSON file button is defined in template and wired here.
  const downloadBtn = document.getElementById("download-json-btn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      if (!lastJson) return;
      const blob = new Blob([prettyJson(lastJson)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pharmacogenomic_risk_results.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
})();

