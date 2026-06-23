let currentCategory = "web-chat-coding";
let sortDirection = 1;

function exportData() {
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ai-services-data.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (typeof importedData !== "object") {
        alert("Invalid data format. Expected a JSON object.");
        return;
      }
      if (confirm("This will replace the entire data table. Continue?")) {
        for (const category in importedData) {
          data[category] = importedData[category];
        }
        renderTable();
        alert("Data imported successfully!");
      }
    } catch (err) {
      alert("Error parsing JSON file: " + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function addNewRow() {
  const newItem = {
    name: "New Service",
    url: "example.com",
    output: "Web",
    desc: "Enter description...",
    free: 0,
    credits: 0,
    sub: 1,
    api: 0,
    local: 0,
    nsfw: 0,
    tier: 3,
  };
  data[currentCategory].push(newItem);
  renderTable();
  setTimeout(() => {
    const tbody = document.getElementById("table-body");
    tbody.scrollTop = tbody.scrollHeight;
  }, 100);
}

function deleteRow(index) {
  if (confirm("Delete this service?")) {
    data[currentCategory].splice(index, 1);
    renderTable();
  }
}

function makeEditable(value, index, field) {
  if (field === "tier") {
    const tierClass = `tier-${value || 3}`;
    const tierNum = value || 3;
    return `<div class="tier-cell ${tierClass}" onclick="showTierDropdown(event, ${index}, ${tierNum})">${tierNum}</div>`;
  }
  if (["free", "credits", "sub", "api", "local", "nsfw"].includes(field)) {
    const dotClass = value ? "binary-yes" : "binary-no";
    return `<span class="binary-dot ${dotClass}" onclick="toggleBinary(${index}, '${field}')"></span>`;
  }
  return `<span class="editable editable-text"
            contenteditable="true"
            onblur="updateField(${index}, '${field}', this.innerText)"
            onkeydown="if(event.key==='Enter'){this.blur();event.preventDefault()}">${value || ""}</span>`;
}

function toggleBinary(index, field) {
  data[currentCategory][index][field] = data[currentCategory][index][field]
    ? 0
    : 1;
  renderTable();
}

let activeTierDropdown = null;

function showTierDropdown(event, index, currentValue) {
  event.stopPropagation();
  if (activeTierDropdown) activeTierDropdown.remove();

  const dropdown = document.createElement("div");
  dropdown.className = "tier-dropdown";

  const tiers = [
    { val: 1, class: "tier-1" },
    { val: 2, class: "tier-2" },
    { val: 3, class: "tier-3" },
    { val: 4, class: "tier-4" },
  ];

  tiers.forEach((tier) => {
    const btn = document.createElement("button");
    btn.innerHTML = `<div class="tier-cell ${tier.class}" style="width:100%;margin:0">${tier.val}</div>`;
    btn.onclick = (e) => {
      e.stopPropagation();
      updateField(index, "tier", tier.val);
      dropdown.remove();
      activeTierDropdown = null;
    };
    dropdown.appendChild(btn);
  });

  event.target.appendChild(dropdown);
  activeTierDropdown = dropdown;

  setTimeout(() => {
    document.addEventListener("click", function closeDropdown() {
      if (dropdown && dropdown.parentNode) dropdown.remove();
      activeTierDropdown = null;
      document.removeEventListener("click", closeDropdown);
    });
  }, 100);
}

function updateField(index, field, value) {
  if (
    field === "tier" ||
    ["free", "credits", "sub", "api", "local", "nsfw"].includes(field)
  ) {
    data[currentCategory][index][field] = parseInt(value);
  } else {
    data[currentCategory][index][field] = value.trim();
  }
  renderTable();
}

function copyToClipboard(text, btn) {
  const dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = text;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
  const original = btn.innerHTML;
  btn.innerHTML = "✓";
  setTimeout(() => (btn.innerHTML = original), 1000);
}



//
// RENDER TABLE, refactored
//

function getLogoSrc(item) {
  return (
    item.logo ||
    `https://www.google.com/s2/favicons?domain=${item.url}&sz=64`
  );
}

/**
 * Builds (or rebuilds) the <colgroup> from columnConfig.
 * Using <col> is the correct way to set column widths — it applies
 * to the entire column (th + all td cells) rather than individual cells.
 * One extra <col> is appended for the delete-button column.
 */
function buildColgroup() {
  const table = document.getElementById("service-table");
  const existing = table.querySelector("colgroup");
  if (existing) existing.remove();

  const colgroup = document.createElement("colgroup");

  columnConfig.forEach(c => {
    const col = document.createElement("col");
    if (c.width) col.style.width = c.width;
    colgroup.appendChild(col);
  });

  // Delete-button column — narrow fixed width
  const delCol = document.createElement("col");
  delCol.style.width = "3%";
  colgroup.appendChild(delCol);

  // colgroup must be the first child of <table>
  table.insertBefore(colgroup, table.firstChild);
}

function createEditableCell(className, value, index, field) {
  return `
    <td class="${className}">
      ${makeEditable(value, index, field)}
    </td>
  `;
}

function createLogoCell(item, index) {
  return `
    <td class="col-logo logo-cell" onclick="openLogoModal(${index})">
      <img
        class="service-logo"
        src="${getLogoSrc(item)}"
        alt="${item.name}"
        onerror="this.style.display='none'"
      >
      <div class="logo-overlay">✏️</div>
    </td>
  `;
}

function createUrlCell(item, index) {
  return `
    <td class="col-url">
      <div class="url-cell">
        <a href="https://${item.url}"
           class="url-link"
           target="_blank">
          ${makeEditable(item.url, index, "url")}
        </a>
        <button
          class="copy-btn"
          onclick="copyToClipboard('${item.url}', this)">
          ❐
        </button>
      </div>
    </td>
  `;
}

function createDeleteCell(index) {
  return `
    <td class="col-check">
      <button
        class="delete-btn"
        onclick="deleteRow(${index})"
        title="Delete service">
        ×
      </button>
    </td>
  `;
}
function createRow(item, index) {
  const col = Object.fromEntries(columnConfig.map(c => [c.key, c]));

  // Width is intentionally omitted here — it is set on the <col> element
  // by buildColgroup() so it applies to the entire column, not just cells.
  const style = (key) => {
    const c = col[key] || {};
    return [
      c.textAlign      && `text-align:${c.textAlign}`,
      c.cellFontSize   && `font-size:${c.cellFontSize}`,
      c.cellFontFamily && `font-family:${c.cellFontFamily}`,
    ].filter(Boolean).join(";");
  };

  const td = (key, value) => `
    <td style="${style(key)}">
      ${makeEditable(value, index, key)}
    </td>
  `;

    return `
    <tr>
      ${td("tier", item.tier || 3)}
      ${createLogoCell(item, index)}
      ${td("name", item.name)}
      ${td("output", item.output)}
      ${td("free", item.free)}
      ${td("credits", item.credits)}
      ${td("sub", item.sub)}
      ${td("api", item.api)}
      ${td("local", item.local)}
      ${td("nsfw", item.nsfw)}
      ${createUrlCell(item, index)}
      ${td("desc", item.desc)}
      ${createDeleteCell(index)}
    </tr>
  `;
}

function renderTable() {
  const tbody = document.getElementById("table-body");
  const items = data[currentCategory] || [];

  tbody.innerHTML = items
    .map((item, index) => createRow(item, index))
    .join("");
}



  //
  //
  //

let currentLogoIndex = null;

function openLogoModal(index) {
  currentLogoIndex = index;
  const item = data[currentCategory][index];
  const modal = document.getElementById("logo-modal");
  const input = document.getElementById("logo-url-input");
  const preview = document.getElementById("logo-preview-img");

  const logoUrl = item.logo || "";
  input.value = logoUrl;
  preview.src =
    logoUrl || `https://www.google.com/s2/favicons?domain=${item.url}&sz=64`;
  preview.style.display = "block";
  modal.style.display = "flex";
}

function closeLogoModal() {
  document.getElementById("logo-modal").style.display = "none";
  currentLogoIndex = null;
}

function saveLogo() {
  if (currentLogoIndex === null) return;
  const input = document.getElementById("logo-url-input");
  const logoUrl = input.value.trim();
  if (logoUrl) data[currentCategory][currentLogoIndex].logo = logoUrl;
  else delete data[currentCategory][currentLogoIndex].logo;
  renderTable();
  closeLogoModal();
}

function clearLogo() {
  if (currentLogoIndex === null) return;
  delete data[currentCategory][currentLogoIndex].logo;
  renderTable();
  closeLogoModal();
}

function setTab(cat, btn) {
  currentCategory = cat;
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("category-title").innerText = btn.innerText;
  sortDirection = 1;
  if (data[currentCategory]) {
    data[currentCategory].sort((a, b) => (a.tier || 3) - (b.tier || 3));
  }
  renderTable();
}

function sortTable(colIndex) {
  const keys = [
    "tier",
    "name",
    "output",
    "free",
    "credits",
    "sub",
    "api",
    "local",
    "nsfw",
    "url",
    "desc",
  ];
  const key = keys[colIndex - 1];
  if (!data[currentCategory]) return;

  data[currentCategory].sort((a, b) => {
    let valA = a[key];
    let valB = b[key];
    if (typeof valA === "string")
      return valA.localeCompare(valB) * sortDirection;
    return (valA - valB) * sortDirection;
  });

  sortDirection *= -1;
  const ths = document.querySelectorAll("th");
  ths.forEach((th) => th.classList.remove("sort-asc", "sort-desc"));
  ths[colIndex].classList.add(sortDirection === 1 ? "sort-desc" : "sort-asc");
  renderTable();
}

window.onload = () => {
  buildColgroup();
  if (data[currentCategory]) {
    data[currentCategory].sort((a, b) => (a.tier || 3) - (b.tier || 3));
  }
  renderTable();
};
