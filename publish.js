
    // ===== 云开发初始化 =====
    const ENV = 'wanwan-d2gafa9gobac0b79b';
    let app;

    // ===== GraphQL 常量 =====
    const API_VERSION = '2024-10';
    const LOCATIONS_QUERY = `query DefaultLocation { locations(first: 1) { edges { node { id name } } } }`;
    const PUBLICATIONS_QUERY = `query SalesChannels { publications(first: 25) { edges { node { id catalog { title } } } } }`;
    const FILES_QUERY = `query SearchImageFiles($first: Int!, $query: String!) { files(first: $first, query: $query) { edges { node { id ... on MediaImage { alt fileStatus image { url } } } } } }`;
    const FILE_UPLOAD_URL_QUERY = `mutation GenerateUploadUrl($filename: String!) { stagedUploadsCreate(input: { filename: $filename, mimeType: "image/jpeg", resource: IMAGE, httpMethod: POST }) { stagedTargets { url parameters { name value } } } }`;
    const FILE_CREATE_MUTATION = `mutation CreateFile($files: [FileCreateInput!]!) { fileCreate(files: $files) { files { id } userErrors { field message } } }`;
    const RECENT_SEARCH_QUERY = `query SearchProducts($query: String!) { products(first: 20, query: $query, sortKey: CREATED_AT, reverse: true) { edges { node { id title handle status createdAt featuredMedia { ... on MediaImage { preview { image { url } } } } variants(first: 1) { edges { node { price sku inventoryQuantity inventoryItem { id sku } } } } resourcePublicationsCount(onlyPublished: true) { count } } } } }`;
    const CHECK_SKU_QUERY = `query CheckSku($query: String!) { productVariants(first: 3, query: $query) { edges { node { id sku product { id title status } } } } }`;
    const PRODUCT_CREATE = `mutation CreateProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) { productCreate(product: $product, media: $media) { product { id handle title seo { title description } variants(first: 1) { edges { node { id } } } } userErrors { field message } } }`;
    const PRODUCT_MEDIA_QUERY = `query ProductMedia($id: ID!) { product(id: $id) { id media(first: 50) { edges { node { id ... on MediaImage { preview { image { url } } } } } } } }`;
    const PRODUCT_UPDATE = `mutation UpdateProduct($product: ProductUpdateInput!) { productUpdate(product: $product) { product { id title } userErrors { field message } } }`;
    const MEDIA_DELETE = `mutation DeleteMedia($productId: ID!, $mediaIds: [ID!]!) { productDeleteMedia(productId: $productId, mediaIds: $mediaIds) { deletedMediaIds userErrors { field message } } }`;
    const MEDIA_CREATE = `mutation CreateMedia($productId: ID!, $media: [CreateMediaInput!]!) { productCreateMedia(productId: $productId, media: $media) { media { id } userErrors { field message } } }`;
    const PRODUCT_TAGS_QUERY = `query ProductTags($id: ID!) { product(id: $id) { tags } }`;
    const VARIANTS_UPDATE = `mutation UpdateDefaultVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) { productVariantsBulkUpdate(productId: $productId, variants: $variants) { productVariants { id price compareAtPrice barcode inventoryPolicy inventoryItem { id sku } } userErrors { field message } } }`;
    const INVENTORY_SET = `mutation SetInventory($input: InventorySetQuantitiesInput!) { inventorySetQuantities(input: $input) { inventoryAdjustmentGroup { id } userErrors { field message } } }`;
    const PUBLISH_MUTATION = `mutation PublishProduct($id: ID!, $input: [PublicationInput!]!) { publishablePublish(id: $id, input: $input) { userErrors { field message } } }`;
    const TAXONOMY_QUERY = `query TaxonomyCategories($search: String!) { taxonomy { categories(search: $search, first: 25) { edges { node { id name fullName isArchived } } } } }`;
    const SHOP_QUERY = `query ShopLastVendor { shop { id ianaTimezone lastVendor: metafield(namespace: "sidekick", key: "last_vendor") { value } } }`;
    const RECENT_PRODUCTS_QUERY = `query RecentProducts($first: Int, $after: String, $last: Int, $before: String) { products(first: $first, after: $after, last: $last, before: $before, sortKey: CREATED_AT, reverse: true) { edges { node { id title handle status createdAt featuredMedia { ... on MediaImage { preview { image { url } } } } variants(first: 1) { edges { node { price sku inventoryQuantity inventoryItem { id sku } } } } resourcePublicationsCount(onlyPublished: true) { count } } } pageInfo { hasNextPage hasPreviousPage startCursor endCursor } } }`;
    const DEFINITION_QUERY = `query LastVendorDefinition { metafieldDefinition(identifier: { ownerType: SHOP, namespace: "sidekick", key: "last_vendor" }) { id } }`;
    const DEFINITION_CREATE = `mutation CreateLastVendorDefinition($definition: MetafieldDefinitionInput!) { metafieldDefinitionCreate(definition: $definition) { createdDefinition { id } userErrors { field message } } }`;
    const METAFIELDS_SET = `mutation SaveLastVendor($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { metafields { id } userErrors { field message } } }`;

    // ===== 纯函数：产品类型推断 =====
    const FALLBACK_PRODUCT_TYPE = 'Power Supply Module';
    const CATEGORY_DEFAULT_SEARCH = '自动化控制组件';
    const CATEGORY_FALLBACK_SEARCH = 'Automation Control Components';
    const CATEGORY_PREFERRED_KEYWORDS = ['business & industrial > automation control components','automation control components','automation control','control component'];
    const CATEGORY_MANUAL_NOTE = 'Shopify 产品类别将在后台手动设置';
    const TAG_MAX = 5;
    const RECENT_PAGE_SIZE = 10;

    const TYPE_RULES = [
      [/PRESS|(^|[^A-Z])PT([^A-Z]|$)/i, 'Pressure Transmitter'],
      [/TEMP|(^|[^A-Z])TT([^A-Z]|$)/i, 'Temperature Transmitter'],
      [/FLOW|(^|[^A-Z])FT([^A-Z]|$)/i, 'Flow Meter'],
      [/LEVEL|(^|[^A-Z])LT([^A-Z]|$)/i, 'Level Transmitter'],
      [/VLV|VALVE/i, 'Control Valve'],
      [/ACTU|(^|[^A-Z])ACT([^A-Z]|$)/i, 'Valve Actuator'],
      [/PUMP|PMP/i, 'Industrial Pump'],
      [/SEAL|GASK|GSKT/i, 'Sealing Kit'],
      [/BEAR|BRG/i, 'Precision Bearing'],
      [/PLC|(^|[^A-Z])CPU([^A-Z]|$)/i, 'PLC Control Module'],
      [/SENS|SNS/i, 'Industrial Sensor'],
      [/RELAY|RLY/i, 'Control Relay'],
      [/POWER|PSU|PWR/i, 'Power Supply Module'],
      [/FILT|FLT/i, 'Filter Element'],
      [/GOVERN|GOV/i, 'Speed Governor'],
      [/INJ/i, 'Fuel Injector'],
      [/CABLE|CBL|HARNESS/i, 'Connection Cable'],
      [/GAUGE|GAG/i, 'Industrial Gauge'],
    ];
    const MIN_TERM_LENGTH = 3, MAX_SEARCH_ATTEMPTS = 12, TARGET_IMAGE_COUNT = 3, MAX_CANDIDATES = 12, SEARCH_PAGE_SIZE = 20;
    const TITLE_MAX = 120, SEO_TITLE_MAX = 60, META_DESCRIPTION_MAX = 155, HANDLE_MAX = 100;
    const SYSTEM_SUFFIXES = ['distributed i/o','distributed io','i/o system','io system','control system','plc system','automation system','system','platform','series'];
    const SMALL_WORDS = ['and','for','of','the','in','with'];
    const TRAILING_STOP_WORDS = ['for','and','with','the','of','in','to','a','an','by','on','from','that','which','is','are','as','at','or'];
    const TYPE_MODIFIERS = ['ac','dc','analog','digital','ethernet','serial','universal','redundant','wireless','hydraulic','pneumatic','electric','optical','thermal','magnetic','smart'];
    const PRODUCT_TYPE_PHRASES = ['differential pressure transmitter','pressure transmitter','temperature transmitter','level transmitter','flow transmitter','flow meter','pressure gauge','control valve','solenoid valve','ball valve','butterfly valve','valve actuator','actuator','speed governor','governor','fuel injector','injector','proximity probe','proximity transducer','vibration sensor','vibration monitor','transducer','thermocouple','sensor','power supply module','power supply','control module','communication module','interface module','input module','output module','i/o module','cpu module','display module','plc module','circuit board','control board','relay module','relay','contactor','servo motor','servo drive','frequency converter','variable frequency drive','electric motor','encoder','bearing','seal kit','mechanical seal','gasket','o-ring','filter element','filter cartridge','filter','centrifugal pump','hydraulic pump','pump','compressor','heat exchanger','impeller','coupling','gearbox','analyzer','controller','regulator','terminal block','wiring harness','connector','cable assembly','cable','battery','fuse','switch'];
    const BATCH_MAX = 50;

    function inferProductType(model) { for (const [p, l] of TYPE_RULES) if (p.test(model)) return l; return 'Industrial Control Module'; }
    function fileNameFromUrl(url) { const q = url.split('?')[0].split('/'); return q[q.length - 1] || url; }
    function shortenTerm(t) { return t.length <= MIN_TERM_LENGTH ? null : t.slice(0, t.length - 1); }
    function truncateAtWord(text, max) { if (text.length <= max) return text; const clipped = text.slice(0, max); const lastSpace = clipped.lastIndexOf(' '); return (lastSpace > max * 0.5 ? clipped.slice(0, lastSpace) : clipped).trim(); }
    function stripHtmlText(text) { return text.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim(); }
    function trimTrailingStopWords(text) { const words = text.split(' '); while (words.length > 1) { const last = words[words.length - 1].toLowerCase().replace(/[^a-z]/g, ''); if (TRAILING_STOP_WORDS.indexOf(last) === -1) break; words.pop(); } return words.join(' ').replace(/[\s,;:\-–]+$/, ''); }
    function toTitleCase(text) { return text.split(/\s+/).filter(w => w.length > 0).map((word, index) => { if (/\d/.test(word)) return word; if (word.length <= 3 && word === word.toUpperCase()) return word; const lower = word.toLowerCase(); if (index > 0 && SMALL_WORDS.indexOf(lower) !== -1) return lower; return lower.split('-').map(p => p.length > 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p).join('-'); }).join(' '); }
    function htmlToPlainLines(text) { return text.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|li|h[1-6]|div|tr|ol|ul|table)>/gi, '\n').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/[ \t]+/g, ' ').split(/\n+/).map(l => l.trim()).filter(l => l.length > 0).join('\n'); }
    function findSpecValue(lines, label) { const wanted = label.toLowerCase(); for (const line of lines.split('\n')) { let ci = line.indexOf(':'); if (ci === -1) ci = line.indexOf('：'); if (ci <= 0) continue; const key = line.slice(0, ci).toLowerCase().replace(/[^a-z/ ]/g, '').trim(); if (key === wanted) { const v = line.slice(ci + 1).trim(); if (v.length > 0) return v; } } return ''; }
    function formatProductName(raw) { const segs = raw.split(/[,;]/).map(p => p.trim()).filter(p => p.length > 0); if (segs.length === 0) return ''; if (segs.length === 1) return segs[0]; return `${segs[0]} (${segs.slice(1).join(', ')})`; }
    function productNameFromSentence(lines) { for (const line of lines.split('\n')) { const m = line.match(/\bis\s+an?\s+([^.;]{3,90})/i); if (m) { const c = m[1].split(/\s+for\s+|\s+that\s+|\s+which\s+|,/i)[0].replace(/\s+/g, ' ').trim(); if (c.length >= 3) return c; } } return ''; }
    function shortenSystemName(raw) { let value = raw.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim(); let changed = true; while (changed) { changed = false; const lower = value.toLowerCase(); for (const suffix of SYSTEM_SUFFIXES) { if (lower.endsWith(` ${suffix}`)) { value = value.slice(0, value.length - suffix.length - 1).trim(); changed = true; break; } } } return value; }
    function matchTypePhrase(text) { const lower = text.toLowerCase(); let bestPhrase = '', bestIndex = -1; for (const phrase of PRODUCT_TYPE_PHRASES) { const index = lower.indexOf(phrase); if (index === -1) continue; const better = bestPhrase.length === 0 || phrase.length > bestPhrase.length || (phrase.length === bestPhrase.length && index < bestIndex); if (better) { bestPhrase = phrase; bestIndex = index; } } return { phrase: bestPhrase, index: bestIndex }; }
    function formatModifier(word) { const lower = word.toLowerCase(); if (lower === 'ac' || lower === 'dc') return lower.toUpperCase(); return lower.charAt(0).toUpperCase() + lower.slice(1); }
    function canonicalTypeFromName(productName, fallbackText, model) { const nameMatch = matchTypePhrase(productName); if (nameMatch.phrase.length > 0) return toTitleCase(nameMatch.phrase); const words = productName.split(/\s+/).filter(w => w.length > 0); if (words.length > 0) { const first = words[0].replace(/[(),]/g, ''); if (first.length >= 3 && !/\d/.test(first)) return first; if (words.length > 1) { const second = words[1].replace(/[(),]/g, ''); if (second.length >= 3 && !/\d/.test(second)) return second; } } const textMatch = matchTypePhrase(fallbackText); if (textMatch.phrase.length > 0) return toTitleCase(textMatch.phrase); return inferProductType(model); }
    function analyzeDescription(description, model) { const lines = htmlToPlainLines(description); const declaredType = findSpecValue(lines, 'Product Type'); const systemRaw = findSpecValue(lines, 'System'); const seriesRaw = findSpecValue(lines, 'Series'); let productName = formatProductName(declaredType.length > 0 ? declaredType : productNameFromSentence(lines)); if (productName.length > 0) { const { phrase, index } = matchTypePhrase(productName); if (phrase.length > 0 && index > 0) { const beforeWords = productName.slice(0, index).trim().split(/[\s,/]+/); const previousWord = (beforeWords[beforeWords.length - 1] || '').replace(/[^A-Za-z-]/g, ''); const isPlainModifier = beforeWords.length === 1 && TYPE_MODIFIERS.indexOf(previousWord.toLowerCase()) !== -1; if (isPlainModifier) productName = `${formatModifier(previousWord)} ${toTitleCase(phrase)}`; } } const canonicalType = canonicalTypeFromName(productName, lines, model); if (productName.length === 0) productName = canonicalType; const systemName = systemRaw.length > 0 ? shortenSystemName(systemRaw) : ''; const seriesNames = []; if (seriesRaw.length > 0) { const cleaned = seriesRaw.replace(/\([^)]*\)/g, ' '); for (const token of cleaned.split(/[/,;|]+/)) { const value = token.trim(); const isNew = seriesNames.every(e => e.toLowerCase() !== value.toLowerCase()); if (value.length >= 2 && value.length <= 40 && isNew) seriesNames.push(value); } } return { productName: toTitleCase(productName), canonicalType: toTitleCase(canonicalType), systemName, seriesNames }; }
    function buildTitleFromInsights(vendor, model, insights, format) { const productName = toTitleCase(insights.productName); const systemName = insights.systemName.length > 0 ? toTitleCase(insights.systemName) : ''; const seriesName = insights.seriesNames.length > 0 ? toTitleCase(insights.seriesNames[0]) : ''; const vendorName = toTitleCase(vendor); let raw = ''; if (format === 'model_vendor_system') { const context = systemName.length > 0 ? systemName : seriesName; const head = [model, vendorName].filter(p => p.length > 0).join(' | '); const tail = [context, productName].filter(p => p.length > 0).join(' '); raw = tail.length > 0 ? `${head} | ${tail}` : head; } else if (format === 'vendor_model_series') { const context = seriesName.length > 0 ? seriesName : systemName; raw = [vendorName, model, context, productName].filter(p => p.length > 0).join(' '); } else { raw = [vendorName, model, productName].filter(p => p.length > 0).join(' '); } return truncateAtWord(raw.replace(/\s+/g, ' ').trim(), TITLE_MAX); }
    function buildTagsFromInsights(insights, vendor) { const raw = [insights.canonicalType, insights.productName]; if (insights.systemName.length > 0) raw.push(insights.systemName); for (const s of insights.seriesNames) raw.push(s); raw.push(vendor); const unique = []; for (const item of raw) { const value = toTitleCase(item.trim()); if (value.length > 0 && unique.length < TAG_MAX && !unique.some(t => t.toLowerCase() === value.toLowerCase())) unique.push(value); } return unique.join(', '); }
    function buildSeoTitleFromTitle(title, model) { const base = title.replace(/\s+/g, ' ').trim(); if (base.length === 0) return ''; let seo = base.length > SEO_TITLE_MAX ? trimTrailingStopWords(truncateAtWord(base, SEO_TITLE_MAX)) : base; if (model.length > 0 && seo.toLowerCase().indexOf(model.toLowerCase()) === -1) { seo = trimTrailingStopWords(truncateAtWord(`${model} ${seo}`, SEO_TITLE_MAX)); } return seo; }
    function buildMetaDescription(description) { const withoutHeadings = description.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, ' '); const plain = stripHtmlText(withoutHeadings); if (plain.length <= META_DESCRIPTION_MAX) return plain; return `${truncateAtWord(plain, META_DESCRIPTION_MAX)}…`; }
    function buildHandleFromTitle(title, model) { const base = model.length > 0 && title.toLowerCase().indexOf(model.toLowerCase()) === -1 ? `${model} ${title}` : title; const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''); if (slug.length <= HANDLE_MAX) return slug; return slug.slice(0, HANDLE_MAX).replace(/-+$/g, ''); }
    function randomInventoryQuantity() { return Math.floor(5 + Math.random() * 16); }
    function parseTags(raw) { return raw.split(/[,，]/).map(t => t.trim()).filter(t => t.length > 0); }
    function parseDirectives(raw) { const lines = raw.split(/\r?\n/); let titleValue = '', typeValue = ''; const tagValues = []; let cursor = 0, matchedLines = 0; while (cursor < lines.length) { const currentLine = lines[cursor].trim(); if (currentLine.length === 0) { cursor += 1; continue; } const m = currentLine.match(/^(TITLE|TYPE|TAGS)\s*[:：]\s*(.*)$/i); if (!m) break; const keyName = m[1].toUpperCase(); const value = m[2].trim(); if (keyName === 'TITLE' && titleValue.length === 0) titleValue = value; else if (keyName === 'TYPE' && typeValue.length === 0) typeValue = value; else if (keyName === 'TAGS') { for (const piece of value.split(',')) { const tagValue = piece.trim(); const isNew = tagValues.every(e => e.toLowerCase() !== tagValue.toLowerCase()); if (tagValue.length > 0 && isNew) tagValues.push(tagValue); } } matchedLines += 1; cursor += 1; } return { title: titleValue, type: typeValue, tags: tagValues, cleanDescription: matchedLines > 0 ? lines.slice(cursor).join('\n').trim() : raw.trim() }; }
    function randomPricing() { const compareAtPrice = Math.floor(150 + Math.random() * 151); const factor = 0.7 + Math.random() * 0.15; let price = Math.round(compareAtPrice * factor); if (price >= compareAtPrice) price = compareAtPrice - 1; const weight = Math.round((1 + Math.random()) * 10) / 10; return { compareAtPrice, price, weight }; }
    function parseBatchInput(raw, vendorName, titleFormat) { const blocks = raw.split(/^[ \t]*-{3,}[ \t]*$/m); const items = []; let skipped = 0, truncated = false; for (let index = 0; index < blocks.length; index += 1) { const block = blocks[index].trim(); if (block.length === 0) continue; const lines = block.split(/\r?\n/); let modelLine = '', cursor = 0; while (cursor < lines.length && modelLine.length === 0) { modelLine = lines[cursor].trim(); cursor += 1; } const rawDescription = lines.slice(cursor).join('\n').trim(); const blockDirectives = parseDirectives(rawDescription); const descriptionText = blockDirectives.cleanDescription; if (modelLine.length === 0) { skipped += 1; continue; } const descForAnalyze = descriptionText.length > 0 ? descriptionText : modelLine; const insights = analyzeDescription(descForAnalyze, modelLine); const noDesc = descriptionText.length === 0; const itemTitle = blockDirectives.title.length > 0 ? blockDirectives.title : buildTitleFromInsights(vendorName, modelLine, insights, titleFormat); if (items.length >= BATCH_MAX) { truncated = true; break; } items.push({ key: `${modelLine}-${index}`, model: modelLine, description: descriptionText, title: itemTitle, productType: blockDirectives.type || insights.canonicalType || FALLBACK_PRODUCT_TYPE, tags: blockDirectives.tags.length > 0 ? blockDirectives.tags : parseTags(buildTagsFromInsights(insights, vendorName)), status: 'pending', message: noDesc ? '⚠️ 无描述' : '', handle: '', _noDesc: noDesc }); } return { items, skipped, truncated }; }
    function toHtml(description, isHtml) { const trimmed = description.trim(); if (isHtml) return trimmed; return trimmed.replace(/\n{3,}/g, '\n\n').replace(/\n+/g, '<br>'); }
    function formatUserErrors(userErrors) { return userErrors.map(i => i.field && i.field.length > 0 ? `${i.field.join('.')}: ${i.message}` : i.message).join(', '); }
    function formatErrors(errors) { return (errors || []).map(i => i.message).join(', '); }

    // ===== GraphQL 重试封装（429 限流自动重试） =====
    const MAX_RETRIES = 3;
    async function gqlWithRetry(query, variables, key) {
      let lastErr;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const result = await gql(query, variables, key);
          if (result?.errors?.some(e => /THROTTLED|429|rate limit/i.test(e.message || ''))) {
            if (attempt < MAX_RETRIES) { const wait = Math.pow(2, attempt) * 1000; await new Promise(r => setTimeout(r, wait)); continue; }
          }
          return result;
        } catch (err) {
          lastErr = err;
          if (/429|rate limit|throttl/i.test(err.message || '') && attempt < MAX_RETRIES) { const wait = Math.pow(2, attempt) * 1000; await new Promise(r => setTimeout(r, wait)); continue; }
          throw err;
        }
      }
      throw lastErr || new Error('重试次数耗尽');
    }

    // ===== 厂商本地记忆 =====
    function getVendorHistory() { try { return JSON.parse(localStorage.getItem('wz_vendors') || '[]'); } catch { return []; } }
    function addVendorHistory(name) { const trimmed = name.trim(); if (!trimmed) return; const list = getVendorHistory(); const idx = list.findIndex(v => v.toLowerCase() === trimmed.toLowerCase()); if (idx >= 0) list.splice(idx, 1); list.unshift(trimmed); if (list.length > 20) list.length = 20; localStorage.setItem('wz_vendors', JSON.stringify(list)); }
    function showVendorList(inputId, listId) { const list = getVendorHistory(); const el = $(listId); if (list.length === 0) { el.classList.remove('show'); return; } el.innerHTML = list.map(v => `<div class="item" onmousedown="pickVendor('${esc(inputId)}','${esc(listId)}','${esc(v)}')">${esc(v)}</div>`).join(''); el.classList.add('show'); }
    function hideVendorList(listId) { setTimeout(() => { $(listId).classList.remove('show'); }, 200); }
    window.pickVendor = function(inputId, listId, name) { $(inputId).value = name; S.vendor = name; hideVendorList(listId); if (inputId === 'vendor') $('batchVendor').value = name; };

    // ===== 草稿箱 =====
    function saveDraft() {
      const draft = { model: $('model').value, vendor: $('vendor').value, title: $('title').value, description: $('description').value, seoTitle: $('seoTitle').value, metaDescription: $('metaDescription').value, handle: $('handle').value, sku: $('sku').value, productType: $('productType').value, barcode: $('barcode').value, inventoryQuantity: $('inventoryQuantity').value, tags: $('tags').value, mode: S.mode, titleFormat: S.titleFormat, savedAt: Date.now() };
      if (!draft.model && !draft.title && !draft.description) { localStorage.removeItem('wz_draft'); return; }
      localStorage.setItem('wz_draft', JSON.stringify(draft));
    }
    function checkDraft() { try { const d = JSON.parse(localStorage.getItem('wz_draft') || 'null'); if (d && d.model) { $('draftBanner').style.display = 'flex'; S._pendingDraft = d; } } catch {} }
    function restoreDraft() { const d = S._pendingDraft; if (!d) return; $('model').value = d.model || ''; $('vendor').value = d.vendor || ''; $('title').value = d.title || ''; $('description').value = d.description || ''; $('seoTitle').value = d.seoTitle || ''; $('metaDescription').value = d.metaDescription || ''; $('handle').value = d.handle || ''; $('sku').value = d.sku || ''; $('productType').value = d.productType || ''; $('barcode').value = d.barcode || ''; $('inventoryQuantity').value = d.inventoryQuantity || ''; $('tags').value = d.tags || ''; if (d.mode) { $('mode').value = d.mode; onModeChange(); } if (d.titleFormat) { $('titleFormat').value = d.titleFormat; S.titleFormat = d.titleFormat; } $('singleContentSection').style.display = 'block'; $('singlePreviewSection').style.display = 'block'; $('draftBanner').style.display = 'none'; toast('草稿已恢复 ✓'); }
    function discardDraft() { localStorage.removeItem('wz_draft'); $('draftBanner').style.display = 'none'; S._pendingDraft = null; toast('草稿已丢弃'); }

    // ===== 图片上传 =====
    async function uploadImageFile(file, key) {
      try {
        const filename = file.name || `upload_${Date.now()}.jpg`;
        const stagedResult = await gqlWithRetry(FILE_UPLOAD_URL_QUERY, { filename }, key);
        if (stagedResult.errors?.length) throw new Error(formatErrors(stagedResult.errors));
        const target = stagedResult.data?.stagedUploadsCreate?.stagedTargets?.[0];
        if (!target?.url) throw new Error('无法获取上传地址');
        const formData = new FormData();
        for (const param of target.parameters) { formData.append(param.name, param.value); }
        formData.append('file', file);
        const uploadResp = await fetch(target.url, { method: 'POST', body: formData });
        if (!uploadResp.ok) throw new Error('上传文件失败（' + uploadResp.status + '）');
        const fileUrl = target.url + '/' + (target.parameters.find(p => p.name === 'key')?.value || filename);
        const createResult = await gqlWithRetry(FILE_CREATE_MUTATION, { files: [{ filename, originalSource: fileUrl, contentType: 'IMAGE' }] }, key);
        if (createResult.errors?.length) throw new Error(formatErrors(createResult.errors));
        const cue = createResult.data?.fileCreate?.userErrors ?? [];
        if (cue.length > 0) throw new Error(formatUserErrors(cue));
        const files = createResult.data?.fileCreate?.files ?? [];
        const fileId = files[0]?.id;
        if (!fileId) throw new Error('文件创建未返回 ID');
        return { id: fileId, url: fileUrl, alt: filename, filename };
      } catch (err) { throw new Error('图片上传失败：' + (err?.message || '未知错误')); }
    }

    // ===== 批量上传图片（纯上传到文件库） =====
    const UPLOAD_CONCURRENCY = 3;
    const uploadState = { files: [], running: false, done: 0, ok: 0, fail: 0 };
    function uploadShopKey() { return S.shopKeys[parseInt($('uploadShopSelect').value || '0', 10)] || ''; }
    function addUploadFiles(fileList) {
      const arr = Array.from(fileList || []).filter(f => f && f.type && f.type.startsWith('image/'));
      if (arr.length === 0) { toast('没有可用的图片文件'); return; }
      const seen = new Set(uploadState.files.map(f => f.name + ':' + f.size + ':' + f.lastModified));
      for (const f of arr) {
        const sig = f.name + ':' + f.size + ':' + f.lastModified;
        if (seen.has(sig)) continue;
        seen.add(sig);
        uploadState.files.push({ file: f, status: 'pending', msg: '', url: '' });
      }
      renderUploadList();
      toast(`已加入 ${arr.length} 张，共 ${uploadState.files.length} 张待传`);
    }
    function clearUploadList() {
      if (uploadState.running) { toast('上传中，请稍候'); return; }
      uploadState.files = []; uploadState.done = 0; uploadState.ok = 0; uploadState.fail = 0;
      $('uploadProgress').style.display = 'none'; $('uploadProgressBar').style.display = 'none';
      $('uploadFileInput').value = ''; renderUploadList();
    }
    function renderUploadList() {
      const box = $('uploadList');
      if (uploadState.files.length === 0) { box.innerHTML = '<div class="hint" style="text-align:center;padding:8px;">还没有图片，拖进来 / 点框 / Ctrl+V 试试吧～</div>'; return; }
      box.innerHTML = uploadState.files.map((it, i) => {
        let badge = '';
        if (it.status === 'pending') badge = '<span class="badge b-muted">待传</span>';
        else if (it.status === 'uploading') badge = '<span class="badge b-pending">上传中</span>';
        else if (it.status === 'success') badge = '<span class="badge b-ok">成功</span>';
        else badge = '<span class="badge b-err">失败</span>';
        const msg = it.msg ? `<div class="up-msg">${esc(it.msg)}</div>` : '';
        const act = it.status === 'success'
          ? `<button class="btn btn-ghost btn-mini" onclick="copyUploadUrl(${i})">复制链接</button>`
          : `<button class="btn btn-ghost btn-mini" onclick="removeUploadItem(${i})">移除</button>`;
        return `<div class="up-item"><div class="up-name">${esc(it.file.name)} <span class="up-size">${(it.file.size / 1024).toFixed(0)}KB</span></div><div class="up-status">${badge}${act}</div>${msg}</div>`;
      }).join('');
    }
    window.removeUploadItem = function(i) { if (uploadState.running) return; uploadState.files.splice(i, 1); renderUploadList(); };
    window.copyUploadUrl = async function(i) { const it = uploadState.files[i]; if (!it || !it.url) return; const ok = await copyText(it.url); toast(ok ? '链接已复制 ✓' : it.url); };
    async function runUpload() {
      if (uploadState.running) return;
      const pending = uploadState.files.filter(f => f.status === 'pending' || f.status === 'error');
      if (pending.length === 0) { toast('没有待上传的图片'); return; }
      if (!uploadShopKey()) { toast('请先在店铺与令牌里添加店铺'); return; }
      pending.forEach(f => { f.status = 'pending'; f.msg = ''; });
      uploadState.running = true; uploadState.done = 0; uploadState.ok = 0; uploadState.fail = 0;
      $('uploadStartBtn').disabled = true; $('uploadClearBtn').disabled = true;
      $('uploadProgress').style.display = 'flex'; $('uploadProgressBar').style.display = 'block';
      renderUploadList();
      const queue = pending.slice();
      const total = queue.length;
      let idx = 0;
      const update = () => {
        const done = uploadState.ok + uploadState.fail;
        $('uploadProgressText').textContent = `正在上传 ${done}/${total}（成功 ${uploadState.ok} · 失败 ${uploadState.fail}）`;
        $('uploadProgressFill').style.width = Math.round(done / total * 100) + '%';
      };
      update();
      async function worker() {
        while (idx < queue.length) {
          const item = queue[idx++];
          if (uploadState.running === false) break;
          item.status = 'uploading'; renderUploadList();
          try {
            const r = await uploadImageFile(item.file, uploadShopKey());
            item.status = 'success'; item.url = r.url; uploadState.ok += 1;
          } catch (e) {
            item.status = 'error'; item.msg = e.message; uploadState.fail += 1;
          }
          update(); renderUploadList();
        }
      }
      const workers = [];
      for (let w = 0; w < UPLOAD_CONCURRENCY; w++) workers.push(worker());
      await Promise.all(workers);
      uploadState.running = false;
      $('uploadStartBtn').disabled = false; $('uploadClearBtn').disabled = false;
      const summary = `上传完成：成功 ${uploadState.ok} 张${uploadState.fail > 0 ? `，失败 ${uploadState.fail} 张` : ''}`;
      $('uploadProgressText').textContent = summary;
      toast(summary);
      if (uploadState.ok > 0) $('uploadOpenLibBtn').style.display = '';
    }

    // ===== 状态 =====
    const S = {
      shops: [], shopKeys: [], shopNames: [], shopStores: [],
      mode: 'single', titleFormat: 'vendor_model_name', descriptionIsHtml: true,
      vendor: '', model: '', title: '', description: '', sku: '', productType: '',
      barcode: '', inventoryQuantity: '', tags: '',
      batchInput: '', batchItems: [], batchRunning: false,
      seoTitle: '', metaDescription: '', handle: '',
      contentVisible: false, previewModel: '', directivePreview: null,
      candidates: [], selectedImages: [], imageSearchTerm: '', searchTermUsed: '',
      imagesLoading: false, imageError: '', pricing: null,
      shopId: '', locationId: '', locationWarning: '', settingsWarning: '', shopTimeZone: '',
      categories: [], categoryId: '', categoryLoading: false, categoryNotice: '',
      publications: [], publicationIds: [], publicationWarning: '',
      recentProducts: [], recentPageInfo: null, recentLoading: false, recentError: '',
      creating: false, createdTitle: '', createdHandle: '', createError: '', createWarning: '',
      recentSearchQuery: '',
      bulkEditing: false, bulkSelected: [], bulkImageMode: 'search', bulkUploadImage: null,
      bulkDoType: false, bulkTypeValue: '', bulkDoTags: false, bulkTagsValue: '', bulkTagsAppend: true,
      bulkDoStatus: false, bulkStatusValue: 'ACTIVE', bulkRunning: false,
    };

    // ===== 云函数封装 =====
    function getCloudKey() { try { return localStorage.getItem('wz_cloud_key') || ''; } catch (e) { return ''; } }
    async function callCloud(action, data = {}) {
      let k = getCloudKey();
      if (!k) { k = prompt('请输入访问口令（首次输入后会记住）') || ''; if (k) { try { localStorage.setItem('wz_cloud_key', k); } catch (e) {} } }
      const res = await app.callFunction({ name: 'wz-shopify', data: { auth: k, action, ...data } });
      if (res.result && res.result.ok === false) {
        if (/口令/.test(res.result.error || '')) { try { localStorage.removeItem('wz_cloud_key'); } catch (e) {} }
        throw new Error(res.result.error || '操作失败');
      }
      return res.result;
    }
    async function gql(query, variables, key) {
      const k = key || S.shopKeys[shopIndex()];
      const r = await callCloud('gql', { key: k, query, variables });
      return r.result;
    }
    function shopIndex() { return parseInt($('shopSelect').value || '0', 10); }

    // ===== 云开发 SDK 按需异步加载（902KB，避免阻塞首屏渲染）=====
    let cloudbaseLoadPromise = null;
    function loadCloudbase() {
      if (window.cloudbase) return Promise.resolve();
      if (cloudbaseLoadPromise) return cloudbaseLoadPromise;
      cloudbaseLoadPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'cloudbase.full.js';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('云开发 SDK 加载失败'));
        document.head.appendChild(s);
      });
      return cloudbaseLoadPromise;
    }

    // ===== 登录 =====
    async function initCloud() {
      await loadCloudbase();
      app = cloudbase.init({ env: ENV, region: 'ap-shanghai' });
      try { const auth = app.auth({ persistence: 'local' }); await auth.signInAnonymously(); } catch (e) { console.warn('匿名登录失败，尝试继续', e); }
    }

    // ===== 店铺管理 =====
    async function loadShops() {
      try {
        const r = await callCloud('listShops');
        const shops = r.shops || [];
        S.shops = shops; S.shopKeys = shops.map(s => s.key); S.shopNames = shops.map(s => s.name); S.shopStores = shops.map(s => s.store);
        renderShops(); renderShopSelect();
        if (shops.length > 0) bootstrapShop();
      } catch (e) { toast('加载店铺失败：' + e.message); }
    }

    function renderShops() {
      const box = $('shopList');
      $('shopEmpty').style.display = S.shops.length === 0 ? 'block' : 'none';
      $('shopCount').textContent = S.shops.length > 0 ? `（${S.shops.length}）` : '';
      box.innerHTML = S.shops.map(s => {
        const tokenHtml = s.hasToken && s.tokenExpiresAt ? `<span class="badge b-ok">令牌有效 · <span data-exp="${s.tokenExpiresAt}">${tokenCountdown(s.tokenExpiresAt)}</span></span>` : `<span class="badge b-muted">令牌未生成</span>`;
        return `<div class="shop-item"><div class="shop-name">${esc(s.name)}</div><div class="shop-store">${esc(s.store)}</div><div style="margin-bottom:10px;">${tokenHtml}</div><div class="row"><button class="btn btn-primary btn-mini" onclick="getToken('${esc(s.key)}')">🔑 令牌</button><button class="btn btn-ghost btn-mini" onclick="renameShop('${esc(s.key)}')">改名</button><button class="btn btn-danger btn-mini" onclick="deleteShop('${esc(s.key)}')">删除</button></div></div>`;
      }).join('');
    }

    function tokenCountdown(ts) { const left = ts - Date.now(); if (left <= 0) return '已过期'; const h = Math.floor(left / 3600000); const m = Math.floor((left % 3600000) / 60000); if (h > 0) return h + '小时' + m + '分'; return m + '分钟'; }
    function tickTokenTimers() { document.querySelectorAll('[data-exp]').forEach(el => { const ts = Number(el.getAttribute('data-exp')); el.textContent = tokenCountdown(ts); }); }

    function renderShopSelect() { const opts = S.shops.map((s, i) => `<option value="${i}">${esc(s.name)}（${esc(s.store)}）</option>`).join(''); $('shopSelect').innerHTML = opts; $('uploadShopSelect').innerHTML = opts; }

    // ===== 店铺初始化 =====
    async function bootstrapShop() {
      try {
        try {
          const loc = await gqlWithRetry(LOCATIONS_QUERY);
          S.locationId = loc.data?.locations?.edges?.[0]?.node?.id || '';
          if (!S.locationId) S.locationWarning = '无法获取默认地点，库存数量将不会写入';
        } catch (e) { S.locationWarning = '无法读取库存地点：' + (e?.message || '未知错误'); }

        try {
          const shopResult = await gqlWithRetry(SHOP_QUERY);
          const shop = shopResult.data?.shop;
          if (shop?.id) S.shopId = shop.id;
          if (shop?.ianaTimezone) S.shopTimeZone = shop.ianaTimezone;
          if (shop?.lastVendor?.value) { S.vendor = shop.lastVendor.value; $('vendor').value = S.vendor; $('batchVendor').value = S.vendor; }
          const defResult = await gqlWithRetry(DEFINITION_QUERY);
          if (!defResult.errors?.length && !defResult.data?.metafieldDefinition?.id) {
            await gqlWithRetry(DEFINITION_CREATE, { definition: { name: '上次使用的厂商', namespace: 'sidekick', key: 'last_vendor', type: 'single_line_text_field', ownerType: 'SHOP', description: '半自动发品助手记录的上次使用的厂商名称', access: { storefront: 'NONE' } } });
          }
        } catch (e) { S.settingsWarning = e?.message || '初始化厂商记忆失败'; }

        try {
          const pub = await gqlWithRetry(PUBLICATIONS_QUERY);
          S.publications = (pub.data?.publications?.edges ?? []).map(e => ({ id: e.node.id, title: e.node?.catalog?.title || '销售渠道' }));
          S.publicationIds = S.publications.map(p => p.id);
        } catch (e) { S.publicationWarning = '无法读取销售渠道'; }

        renderPublications(); renderBanners();
        loadCategories(CATEGORY_DEFAULT_SEARCH);
        loadRecentProducts(null, 'forward');
      } catch (e) { console.warn('初始化店铺信息失败', e); }
    }

    // ===== 横幅 =====
    function renderBanners() {
      const parts = [];
      if (S.settingsWarning) parts.push(`<div class="banner warning"><div class="h">厂商记忆功能受限</div>${esc(S.settingsWarning)}</div>`);
      if (S.locationWarning) parts.push(`<div class="banner warning"><div class="h">库存写入受限</div>${esc(S.locationWarning)}</div>`);
      if (S.publicationWarning) parts.push(`<div class="banner warning"><div class="h">销售渠道受限</div>${esc(S.publicationWarning)}</div>`);
      if (S.imageError) parts.push(`<div class="banner error"><div class="h">图片搜索失败</div>${esc(S.imageError)}</div>`);
      if (S.createError) parts.push(`<div class="banner error"><div class="h">发布失败</div>${esc(S.createError)}</div>`);
      if (S.createWarning) parts.push(`<div class="banner warning"><div class="h">部分内容未写入</div>${esc(S.createWarning)}</div>`);
      if (S.createdTitle) parts.push(`<div class="banner success"><div class="h">产品已创建并上架 🎉</div>${esc(S.createdTitle)}${S.createdHandle ? `<br>Handle：${esc(S.createdHandle)}` : ''}</div>`);
      $('banners').innerHTML = parts.join('');
    }

    // ===== 类目 =====
    async function loadCategories(searchTerm) {
      S.categoryLoading = true; S.categoryNotice = ''; renderCategoryArea();
      try {
        const result = await gqlWithRetry(TAXONOMY_QUERY, { search: searchTerm });
        if (result.errors?.length) { S.categories = []; S.categoryId = ''; S.categoryNotice = `${CATEGORY_MANUAL_NOTE}（${formatErrors(result.errors)}）`; }
        else {
          const options = (result.data?.taxonomy?.categories?.edges ?? []).map(e => e.node).filter(n => n?.id && n?.isArchived !== true).map(n => ({ id: n.id, fullName: n.fullName }));
          S.categories = options;
          if (options.length === 0) { S.categoryId = ''; if (searchTerm !== CATEGORY_FALLBACK_SEARCH) { S.categoryLoading = false; await loadCategories(CATEGORY_FALLBACK_SEARCH); return; } S.categoryNotice = CATEGORY_MANUAL_NOTE; }
          else { let preferred; for (const kw of CATEGORY_PREFERRED_KEYWORDS) { preferred = options.find(o => o.fullName.toLowerCase().includes(kw)); if (preferred) break; } S.categoryId = (preferred ?? options[0]).id; }
        }
      } catch (err) { S.categories = []; S.categoryId = ''; S.categoryNotice = `${CATEGORY_MANUAL_NOTE}（${err?.message || '查询类别失败'}）`; }
      finally { S.categoryLoading = false; renderCategoryArea(); }
    }
    function renderCategoryArea() {
      const area = $('categoryArea');
      if (S.categoryLoading) { area.innerHTML = '<div class="progress"><div class="spin"></div>正在搜索分类…</div>'; return; }
      if (S.categories.length > 0) { area.innerHTML = `<select class="input" id="categorySelect"><option value="">不设置类别（后台手动设置）</option>${S.categories.map(c => `<option value="${esc(c.id)}" ${c.id === S.categoryId ? 'selected' : ''}>${esc(c.fullName)}</option>`).join('')}</select>`; }
      else { area.innerHTML = `<span class="hint">${esc(S.categoryNotice || CATEGORY_MANUAL_NOTE)}</span>`; }
    }

    // ===== 销售渠道 =====
    function renderPublications() {
      $('pubCount').textContent = `（已选 ${S.publicationIds.length}/${S.publications.length}）`;
      const area = $('pubArea');
      if (S.publications.length === 0) { area.innerHTML = '<span class="hint">未找到可用销售渠道</span>'; return; }
      area.innerHTML = S.publications.map(p => `<label class="checkline"><input type="checkbox" ${S.publicationIds.includes(p.id) ? 'checked' : ''} onchange="togglePublication('${esc(p.id)}', this.checked)"> ${esc(p.title)}</label>`).join('');
    }
    window.togglePublication = function(id, checked) { if (checked && !S.publicationIds.includes(id)) S.publicationIds.push(id); if (!checked) S.publicationIds = S.publicationIds.filter(i => i !== id); renderPublications(); };

    // ===== 最近发品 =====
    async function loadRecentProducts(cursor, direction) {
      S.recentLoading = true; S.recentError = ''; renderRecent();
      try {
        const result = await gqlWithRetry(RECENT_PRODUCTS_QUERY, { first: direction === 'forward' ? RECENT_PAGE_SIZE : null, after: direction === 'forward' ? cursor : null, last: direction !== 'forward' ? RECENT_PAGE_SIZE : null, before: direction !== 'forward' ? cursor : null });
        if (result.errors?.length) { S.recentError = formatErrors(result.errors); }
        else {
          const edges = result.data?.products?.edges ?? [];
          S.recentProducts = edges.map(edge => { const node = edge.node; const vn = node?.variants?.edges?.[0]?.node ?? null; return { id: node.id, title: node.title, status: node.status, createdAt: node.createdAt, imageUrl: node?.featuredMedia?.preview?.image?.url ?? null, price: vn?.price ?? null, sku: vn?.sku ?? null, inventoryQuantity: vn?.inventoryQuantity ?? null, inventoryItemId: vn?.inventoryItem?.id ?? null, publishedCount: node?.resourcePublicationsCount?.count ?? 0 }; });
          S.recentPageInfo = result.data?.products?.pageInfo ?? null;
        }
      } catch (err) { S.recentError = err?.message || '加载失败'; }
      finally { S.recentLoading = false; renderRecent(); }
    }
    async function searchRecentProducts(query) {
      S.recentLoading = true; S.recentError = ''; S.recentSearchQuery = query; renderRecent();
      try {
        const result = await gqlWithRetry(RECENT_SEARCH_QUERY, { query });
        if (result.errors?.length) { S.recentError = formatErrors(result.errors); }
        else {
          const edges = result.data?.products?.edges ?? [];
          S.recentProducts = edges.map(edge => { const node = edge.node; const vn = node?.variants?.edges?.[0]?.node ?? null; return { id: node.id, title: node.title, status: node.status, createdAt: node.createdAt, imageUrl: node?.featuredMedia?.preview?.image?.url ?? null, price: vn?.price ?? null, sku: vn?.sku ?? null, inventoryQuantity: vn?.inventoryQuantity ?? null, inventoryItemId: vn?.inventoryItem?.id ?? null, publishedCount: node?.resourcePublicationsCount?.count ?? 0 }; });
          S.recentPageInfo = null;
        }
      } catch (err) { S.recentError = err?.message || '搜索失败'; }
      finally { S.recentLoading = false; renderRecent(); }
    }
    function formatDate(iso) {
      if (!iso) return '—';
      try {
        const d = new Date(iso);
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } catch { return iso; }
    }
    function renderRecent() {
      const body = $('recentBody');
      if (S.recentLoading) { body.innerHTML = '<tr><td colspan="7" class="hint">加载中…</td></tr>'; bindRecentChecks(); return; }
      if (S.recentError) { body.innerHTML = `<tr><td colspan="7" class="hint error">${esc(S.recentError)}</td></tr>`; bindRecentChecks(); return; }
      if (S.recentProducts.length === 0) { body.innerHTML = `<tr><td colspan="7" class="hint">${S.recentSearchQuery ? '没搜到匹配的商品' : '还没有商品'}</td></tr>`; bindRecentChecks(); return; }
      const shopStore = S.shopStores[shopIndex()] || '';
      const adminBase = shopStore ? `https://${shopStore}/admin` : '';
      const storeBase = shopStore ? `https://${shopStore}` : '';
      body.innerHTML = S.recentProducts.map(item => {
        const gid = item.id?.replace('gid://shopify/Product/', '') || '';
        const adminLink = adminBase && gid ? `${adminBase}/products/${gid}` : '';
        const storeLink = storeBase && item.handle ? `${storeBase}/products/${item.handle}` : '';
        const titleCell = storeLink
          ? `<a class="recent-title-link" href="${esc(storeLink)}" target="_blank" title="点击查看前台页面">${esc(item.title)}</a>`
          : esc(item.title);
        const links = [];
        if (adminLink) links.push(`<a class="recent-link" href="${esc(adminLink)}" target="_blank">后台</a>`);
        if (storeLink) links.push(`<a class="recent-link" href="${esc(storeLink)}" target="_blank">前台</a>`);
        const checked = S.bulkSelected.includes(item.id) ? 'checked' : '';
        return `<tr><td><input type='checkbox' class='recent-check' data-id='${esc(item.id)}' data-sku='${esc(item.sku || '')}' data-inv='${esc(item.inventoryItemId || '')}' ${checked}></td><td>${titleCell}</td><td>${item.status === 'ACTIVE' ? '<span class="badge b-ok">已上架</span>' : item.status === 'DRAFT' ? '<span class="badge b-info">草稿</span>' : '<span class="badge b-muted">归档</span>'}</td><td>${item.price ? '$' + item.price : '—'}</td><td>${esc(item.sku || '—')}</td><td>${item.inventoryQuantity != null ? item.inventoryQuantity : '—'}</td><td class="recent-date">${formatDate(item.createdAt)}</td><td class="recent-actions">${links.join(' ')}</td></tr>`;
      }).join('');
      bindRecentChecks();
    }

    // ===== 图片搜索 =====
    async function searchFiles(term, fallbackAlt) {
      try {
        const result = await gqlWithRetry(FILES_QUERY, { first: SEARCH_PAGE_SIZE, query: `filename:${term}* AND media_type:IMAGE` });
        if (result.errors?.length) return { found: [], error: formatErrors(result.errors) };
        const nodes = (result.data?.files?.edges ?? []).map(e => e.node);
        const found = nodes.filter(n => n?.fileStatus === 'READY' && n?.image?.url).map(n => ({ id: n.id, url: n.image.url, alt: n.alt || `${fallbackAlt} 产品图片`, filename: fileNameFromUrl(n.image.url) }));
        return { found, error: '' };
      } catch (err) { return { found: [], error: err?.message || '搜索图片失败' }; }
    }
    async function collectImagesForModel(targetModel) {
      let term = targetModel.trim(); let attempts = 0; const collected = []; const seenIds = new Set(); let lastMatchedTerm = '';
      while (term && attempts < MAX_SEARCH_ATTEMPTS && collected.length < TARGET_IMAGE_COUNT) {
        attempts += 1; const { found, error } = await searchFiles(term, targetModel);
        if (error) return { images: collected, error, term: lastMatchedTerm };
        for (const image of found) { if (collected.length >= MAX_CANDIDATES) break; if (seenIds.has(image.id)) continue; seenIds.add(image.id); collected.push(image); lastMatchedTerm = term; }
        if (collected.length >= TARGET_IMAGE_COUNT) break; term = shortenTerm(term);
      }
      return { images: collected, error: '', term: lastMatchedTerm };
    }
    function renderImages() {
      $('imgCountLabel').textContent = `产品图片（已选 ${S.selectedImages.length}/${TARGET_IMAGE_COUNT}）`;
      const status = $('imageStatus');
      if (S.imagesLoading) status.innerHTML = '<div class="progress"><div class="spin"></div>正在按型号逐字符降级搜索文件库图片…</div>';
      else if (S.searchTermUsed) status.innerHTML = `<span class="hint">当前搜索词：${esc(S.searchTermUsed)}</span>`;
      else status.innerHTML = '';
      $('selectedImagesWrap').innerHTML = S.selectedImages.map(img => `<div class="box"><img src="${esc(img.url)}" alt="${esc(img.alt)}"><button class="btn btn-danger btn-mini" style="margin-top:4px;" onclick="removeSelectedImage('${esc(img.id)}')">移除</button></div>`).join('') || (S.imagesLoading ? '' : '<span class="hint">未选择图片，将创建无图片产品</span>');
      const wrap = $('candidatesWrap');
      if (!S.imagesLoading && S.candidates.length > 0) {
        wrap.innerHTML = S.candidates.map(img => { const on = S.selectedImages.some(i => i.id === img.id); const disabled = !on && S.selectedImages.length >= TARGET_IMAGE_COUNT; return `<div class="img-item ${on ? 'on' : ''}" onclick="toggleImage('${esc(img.id)}')" title="${esc(img.filename)}"><img src="${esc(img.url)}" alt="${esc(img.alt)}" loading="lazy"></div>`; }).join('');
      } else if (!S.imagesLoading) { wrap.innerHTML = '<span class="hint">没有匹配的图片，请换一个前缀再试</span>'; } else wrap.innerHTML = '';
    }
    async function loadPreview(targetModel) {
      S.previewModel = targetModel; S.pricing = randomPricing(); S.candidates = []; S.selectedImages = []; S.imageError = ''; S.searchTermUsed = ''; S.imageSearchTerm = targetModel; $('imageSearchTerm').value = targetModel; S.imagesLoading = true; renderBanners(); renderImages(); renderPricing();
      const { images, error, term } = await collectImagesForModel(targetModel);
      if (error) { S.imageError = error; S.imagesLoading = false; renderBanners(); renderImages(); return; }
      S.candidates = images; S.selectedImages = images.slice(0, TARGET_IMAGE_COUNT); S.searchTermUsed = term; S.imagesLoading = false; renderImages();
    }
    async function runManualSearch() {
      const term = $('imageSearchTerm').value.trim(); if (term.length === 0) return;
      S.imageError = ''; const { found, error } = await searchFiles(term, term);
      if (error) { S.imageError = error; renderBanners(); } else { S.candidates = found; S.searchTermUsed = term; renderImages(); }
    }
    window.toggleImage = function(id) { const isOn = S.selectedImages.some(i => i.id === id); if (isOn) { S.selectedImages = S.selectedImages.filter(i => i.id !== id); } else { if (S.selectedImages.length >= TARGET_IMAGE_COUNT) { toast('最多选 ' + TARGET_IMAGE_COUNT + ' 张图'); return; } const img = S.candidates.find(i => i.id === id); if (img) S.selectedImages.push(img); } renderImages(); };
    window.removeSelectedImage = function(id) { S.selectedImages = S.selectedImages.filter(i => i.id !== id); renderImages(); };
    window.removeUploadedImage = function(id) { S.selectedImages = S.selectedImages.filter(i => i.id !== id); renderImages(); };

    function renderPricing() { const p = S.pricing; $('pricingBox').innerHTML = p ? `<div><span class="hint">比较价格</span><br><b>$${p.compareAtPrice}.00</b></div><div><span class="hint">售价</span><br><b>$${p.price}.00</b></div><div><span class="hint">重量</span><br><b>${p.weight.toFixed(1)} kg</b></div>` : ''; }

    // ===== 单个发品流程 =====
    function startFilling() {
      const model = $('model').value.trim(); const vendor = $('vendor').value.trim();
      if (!model || !vendor) { toast('请先填型号和厂商'); return; }
      addVendorHistory(vendor);
      S.createdTitle = ''; S.createdHandle = ''; S.createError = ''; S.createWarning = '';
      S.title = ''; S.description = ''; S.productType = FALLBACK_PRODUCT_TYPE; S.tags = '';
      S.seoTitle = ''; S.metaDescription = ''; S.handle = ''; S.directivePreview = null;
      S.sku = model; S.barcode = 'USA'; S.inventoryQuantity = String(randomInventoryQuantity());
      S.contentVisible = true; S.model = model; S.vendor = vendor;
      $('title').value = ''; $('description').value = ''; $('seoTitle').value = ''; $('metaDescription').value = '';
      $('handle').value = ''; $('tags').value = ''; $('productType').value = S.productType;
      $('sku').value = S.sku; $('barcode').value = S.barcode; $('inventoryQuantity').value = S.inventoryQuantity;
      $('seoLen').textContent = ''; $('metaLen').textContent = '';
      $('singleContentSection').style.display = 'block';
      $('singlePreviewSection').style.display = 'block';
      renderBanners(); renderDirectivePreview();
      loadPreview(model);
    }

    function renderDirectivePreview() {
      const box = $('directivePreview'); const d = S.directivePreview;
      if (d && (d.title.length > 0 || d.type.length > 0 || d.tags.length > 0)) {
        box.style.display = 'block';
        box.innerHTML = `<b>已从描述中解析（优先使用）</b><br>` + (d.title.length > 0 ? `TITLE：${esc(d.title)}<br>` : '') + (d.type.length > 0 ? `TYPE：${esc(d.type)}<br>` : '') + (d.tags.length > 0 ? `TAGS：${esc(d.tags.join(', '))}` : '');
      } else box.style.display = 'none';
    }

    function generateFromDescription() {
      const desc = $('description').value.trim(); if (desc.length === 0) return;
      const vendor = $('vendor').value.trim(); const model = $('model').value.trim();
      const directives = parseDirectives(desc); const cleanBody = directives.cleanDescription;
      S.directivePreview = directives;
      if (cleanBody !== desc) { $('description').value = cleanBody; S.description = cleanBody; }
      if (cleanBody.length === 0) { renderDirectivePreview(); return; }
      const insights = analyzeDescription(cleanBody, model);
      const generatedTitle = directives.title.length > 0 ? directives.title : buildTitleFromInsights(vendor, model, insights, S.titleFormat);
      S.title = generatedTitle; $('title').value = generatedTitle;
      S.productType = directives.type || insights.canonicalType || FALLBACK_PRODUCT_TYPE; $('productType').value = S.productType;
      S.tags = directives.tags.length > 0 ? directives.tags.join(', ') : buildTagsFromInsights(insights, vendor); $('tags').value = S.tags;
      S.seoTitle = buildSeoTitleFromTitle(generatedTitle, model); $('seoTitle').value = S.seoTitle; $('seoLen').textContent = `（${S.seoTitle.length} 字符）`;
      S.metaDescription = buildMetaDescription(cleanBody); $('metaDescription').value = S.metaDescription; $('metaLen').textContent = `（${S.metaDescription.length} 字符）`;
      S.handle = buildHandleFromTitle(generatedTitle, model); $('handle').value = S.handle;
      renderDirectivePreview();
    }

    function refreshPreviewIfModelChanged() {
      const trimmed = $('model').value.trim();
      if (S.contentVisible && trimmed.length > 0 && trimmed !== S.previewModel) loadPreview(trimmed);
    }

    // ===== 查重 =====
    async function checkSkuExists(sku) {
      if (!sku || !String(sku).trim()) return null;
      try {
        const result = await gqlWithRetry(CHECK_SKU_QUERY, { query: `sku:${String(sku).trim()}` });
        if (result.errors?.length) return null;
        const edges = result.data?.productVariants?.edges ?? [];
        if (edges.length === 0) return null;
        const node = edges[0].node; return { sku: node.sku || sku, title: node.product?.title || '', status: node.product?.status || '' };
      } catch { return null; }
    }

    // ===== 发布产品 =====
    async function saveVendorMemory(vendorName) {
      if (!S.shopId) return '';
      try {
        const result = await gqlWithRetry(METAFIELDS_SET, { metafields: [{ ownerId: S.shopId, namespace: 'sidekick', key: 'last_vendor', type: 'single_line_text_field', value: vendorName }] });
        if (result.errors?.length) return `厂商记忆保存失败：${formatErrors(result.errors)}`;
        const ue = result.data?.metafieldsSet?.userErrors ?? [];
        if (ue.length > 0) return `厂商记忆保存失败：${formatUserErrors(ue)}`;
        return '';
      } catch (e) { return ''; }
    }

    async function publishOneProduct(params) {
      const outcome = { success: false, id: '', title: '', handle: '', error: '', warning: '' };
      try {
        const media = params.images.length > 0 ? params.images.map(img => ({ originalSource: img.url, mediaContentType: 'IMAGE', alt: params.productTitle })) : null;
        const productInput = { title: params.productTitle, descriptionHtml: toHtml(params.descriptionSource, params.descriptionIsHtml), vendor: params.vendorName, status: params.status || 'ACTIVE', productType: params.typeValue, tags: params.tagList };
        if (params.seoTitleValue.length > 0 || params.metaDescriptionValue.length > 0) { const seoInput = {}; if (params.seoTitleValue.length > 0) seoInput.title = params.seoTitleValue; if (params.metaDescriptionValue.length > 0) seoInput.description = params.metaDescriptionValue; productInput.seo = seoInput; }
        if (params.handleValue.length > 0) productInput.handle = params.handleValue;
        const catSelect = document.getElementById('categorySelect');
        if (catSelect && catSelect.value) productInput.category = catSelect.value;

        const createResult = await gqlWithRetry(PRODUCT_CREATE, { product: productInput, media });
        if (createResult.errors?.length) { outcome.error = `创建失败：${formatErrors(createResult.errors)}`; return outcome; }
        const cue = createResult.data?.productCreate?.userErrors ?? [];
        if (cue.length > 0) { outcome.error = `创建失败：${formatUserErrors(cue)}`; return outcome; }
        const product = createResult.data?.productCreate?.product;
        if (!product?.id) { outcome.error = '创建失败：未返回产品信息'; return outcome; }
        outcome.success = true; outcome.id = product.id; outcome.title = product.title || params.productTitle; outcome.handle = product.handle || params.handleValue;

        const variantId = product.variants?.edges?.[0]?.node?.id;
        if (!variantId) { outcome.warning = '未找到默认变体，价格与重量未写入'; return outcome; }

        const variantResult = await gqlWithRetry(VARIANTS_UPDATE, { productId: product.id, variants: [{ id: variantId, price: params.pricingValue.price.toFixed(2), compareAtPrice: params.pricingValue.compareAtPrice.toFixed(2), taxable: true, barcode: params.barcodeValue, inventoryPolicy: 'CONTINUE', inventoryItem: { sku: params.skuValue, tracked: true, requiresShipping: true, measurement: { weight: { value: params.pricingValue.weight, unit: 'KILOGRAMS' } } } }] });
        if (variantResult.errors?.length) outcome.warning = `价格/SKU/条码写入失败：${formatErrors(variantResult.errors)}`;
        else { const vue = variantResult.data?.productVariantsBulkUpdate?.userErrors ?? []; if (vue.length > 0) outcome.warning = `价格/SKU/条码写入失败：${formatUserErrors(vue)}`; }

        const invId = variantResult.data?.productVariantsBulkUpdate?.productVariants?.[0]?.inventoryItem?.id;
        let invLocationId = S.locationId;
        if (!invLocationId) {
          try { const locR = await gqlWithRetry(LOCATIONS_QUERY); invLocationId = locR.data?.locations?.edges?.[0]?.node?.id || ''; } catch (e) {}
        }
        if (invId && invLocationId && params.quantity > 0) {
          const ir = await gqlWithRetry(INVENTORY_SET, { input: { name: 'available', reason: 'correction', quantities: [{ inventoryItemId: invId, locationId: invLocationId, quantity: params.quantity }] } });
          if (ir.errors?.length) outcome.warning = outcome.warning ? `${outcome.warning} 库存写入失败：${formatErrors(ir.errors)}` : `库存写入失败：${formatErrors(ir.errors)}`;
          else { const iue = ir.data?.inventorySetQuantities?.userErrors ?? []; if (iue.length > 0) outcome.warning = outcome.warning ? `${outcome.warning} 库存写入失败：${formatUserErrors(iue)}` : `库存写入失败：${formatUserErrors(iue)}`; }
        } else if (invId && params.quantity > 0) {
          outcome.warning = outcome.warning ? `${outcome.warning} 库存未写入：未获取到库存地点(locationId 为空，请检查应用权限 read_locations)` : `库存未写入：未获取到库存地点(locationId 为空，请检查应用权限 read_locations)`;
        }

        if (params.status !== 'DRAFT' && S.publicationIds.length > 0) {
          const pr = await gqlWithRetry(PUBLISH_MUTATION, { id: product.id, input: S.publicationIds.map(pid => ({ publicationId: pid })) });
          if (pr.errors?.length) outcome.warning = outcome.warning ? `${outcome.warning} 渠道上架失败：${formatErrors(pr.errors)}` : `渠道上架失败：${formatErrors(pr.errors)}`;
          else { const pue = pr.data?.publishablePublish?.userErrors ?? []; if (pue.length > 0) outcome.warning = outcome.warning ? `${outcome.warning} 渠道上架失败：${formatUserErrors(pue)}` : `渠道上架失败：${formatUserErrors(pue)}`; }
        } else if (params.status !== 'DRAFT') {
          outcome.warning = outcome.warning ? `${outcome.warning} 未分配到任何销售渠道(publicationIds 为空)` : `未分配到任何销售渠道(publicationIds 为空)`;
        }
        return outcome;
      } catch (err) { outcome.error = err?.message || '创建产品时发生错误'; return outcome; }
    }

    async function createProduct() {
      const model = $('model').value.trim(); const vendor = $('vendor').value.trim();
      const title = $('title').value.trim(); const desc = $('description').value.trim();
      const directives = parseDirectives(desc); const publishDesc = directives.cleanDescription;
      const publishTitle = title.length > 0 ? title : directives.title;
      ['model','vendor','title','description'].forEach(id => $(id).classList.remove('field-error'));
      if (!model || !vendor || !publishTitle || !publishDesc) { toast('请填完整：型号、厂商、标题、描述');
        if (!model) $('model').classList.add('field-error');
        if (!vendor) $('vendor').classList.add('field-error');
        if (!publishTitle) $('title').classList.add('field-error');
        if (!publishDesc) $('description').classList.add('field-error');
        return; }

      const targetSku = $('sku').value.trim() || model;
      const dup = await checkSkuExists(targetSku);
      if (dup) { if (!confirm(`⚠️ SKU「${targetSku}」已发过：\n\n${dup.title}\n状态：${dup.status}\n\n还要再发一次吗？`)) return; }

      if (S.creating) return;
      S.creating = true; $('createBtn').disabled = true;
      S.createError = ''; S.createWarning = ''; S.createdTitle = ''; S.createdHandle = '';
      renderBanners();

      const parsedTags = parseTags($('tags').value);
      const parsedQty = parseInt($('inventoryQuantity').value, 10);
      const resolvedQty = Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : randomInventoryQuantity();

      const result = await publishOneProduct({
        vendorName: vendor, productTitle: publishTitle, descriptionSource: publishDesc, descriptionIsHtml: S.descriptionIsHtml,
        typeValue: $('productType').value.trim() || directives.type || FALLBACK_PRODUCT_TYPE,
        tagList: parsedTags.length > 0 ? parsedTags : directives.tags.length > 0 ? directives.tags : [vendor],
        skuValue: $('sku').value.trim() || model, barcodeValue: $('barcode').value.trim() || 'USA',
        quantity: resolvedQty, images: S.selectedImages,
        seoTitleValue: $('seoTitle').value.trim(), metaDescriptionValue: $('metaDescription').value.trim(),
        handleValue: $('handle').value.trim(), pricingValue: S.pricing ?? randomPricing(),
      });

      if (result.error) S.createError = result.error;
      else { S.createdTitle = result.title; S.createdHandle = result.handle; }
      if (result.warning) S.createWarning = `产品已创建，但${result.warning}`;
      if (result.success) { const vw = await saveVendorMemory(vendor); if (vw) S.createWarning = S.createWarning ? `${S.createWarning} ${vw}` : vw; addVendorHistory(vendor); loadRecentProducts(null, 'forward'); localStorage.removeItem('wz_draft'); }
      S.creating = false; $('createBtn').disabled = false;
      renderBanners();
      if (result.success) { toast('创建并上架成功 🎉'); $('createBtn').textContent = '✅ 已创建（刷新发下一个）'; setTimeout(() => { $('createBtn').textContent = '✅ 创建并上架'; }, 3000); }
    }

    // ===== 批量发品 =====
    function renderBatchTable() {
      if (S.batchItems.length === 0) { $('batchTableWrap').style.display = 'none'; return; }
      $('batchTableWrap').style.display = 'block';
      $('batchListBody').innerHTML = S.batchItems.map((item, i) => {
        const badge = item.status === 'success' ? '<span class="badge b-ok">成功</span>' : item.status === 'error' ? '<span class="badge b-err">失败</span>' : item.status === 'processing' ? '<span class="badge b-info">处理中</span>' : '<span class="badge b-muted">待发</span>';
        const expandIcon = item.expanded ? '▼' : '▶';
        let detail = '';
        if (item.expanded) {
          detail = `<div class="batch-detail">
            <div class="label">标题</div><div>${esc(item.title)}</div>
            <div class="label">类型</div><div>${esc(item.productType)}</div>
            <div class="label">标签</div><div>${esc(item.tags.join(', '))}</div>
            <div class="label">描述</div><div style="max-height:120px;overflow-y:auto;">${esc(item.description.slice(0, 500))}${item.description.length > 500 ? '...' : ''}</div>
            ${item.handle ? `<div class="label">Handle</div><div>${esc(item.handle)}</div>` : ''}
            ${item.message ? `<div class="label">状态</div><div>${esc(item.message)}</div>` : ''}
          </div>`;
        }
        return `<div style="border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <span class="batch-expand" onclick="toggleBatchExpand(${i})">${expandIcon} ${esc(item.model)}</span>
            ${badge}
          </div>
          <div style="font-size:12px;color:var(--soft);margin-top:4px;">${esc(item.title)}</div>
          ${detail}
        </div>`;
      }).join('');
      $('btnBatchRun').disabled = S.batchRunning;
    }
    window.toggleBatchExpand = function(i) { S.batchItems[i].expanded = !S.batchItems[i].expanded; renderBatchTable(); };
    function parseBatch() {
      const vendor = $('batchVendor').value.trim();
      const input = $('batchInput').value.trim();
      if (!vendor || !input) { toast('请先填厂商和批量内容'); return; }
      S.vendor = vendor;
      addVendorHistory(vendor);
      const { items, skipped, truncated } = parseBatchInput(input, vendor, S.titleFormat);
      S.batchItems = items;
      const notes = [`已解析 ${items.length} 个产品。`];
      if (skipped > 0) notes.push(`${skipped} 个缺少型号或描述，已跳过。`);
      if (truncated) notes.push(`单次最多 ${BATCH_MAX} 个，超出请分批。`);
      $('batchNotice').textContent = notes.join('');
      renderBatchTable();
    }
    function clearBatch() { S.batchInput = ''; S.batchItems = []; $('batchInput').value = ''; $('batchNotice').textContent = ''; $('batchProgress').style.display = 'none'; $('batchProgressBar').style.display = 'none'; renderBatchTable(); }

    async function runBatch() {
      const vendor = $('batchVendor').value.trim();
      if (!vendor || S.batchItems.length === 0 || S.batchRunning) return;
      const scheduleMode = $('batchScheduleOn').checked;
      S.batchRunning = true; $('btnBatchRun').disabled = true;
      $('batchProgress').style.display = 'flex';
      $('batchProgressBar').style.display = 'block';
      let successCount = 0;

      for (let i = 0; i < S.batchItems.length; i++) {
        const item = S.batchItems[i];
        $('batchProgressText').textContent = scheduleMode
          ? `创建草稿 ${i + 1}/${S.batchItems.length}：${item.model}`
          : `处理 ${i + 1}/${S.batchItems.length}：${item.model}`;
        $('batchProgressFill').style.width = `${Math.round((i / S.batchItems.length) * 100)}%`;
        item.status = 'processing'; item.message = ''; renderBatchTable();

        const dup = await checkSkuExists(item.model);
        if (dup) { item.status = 'error'; item.message = '已发过，跳过'; renderBatchTable(); continue; }

        const imageResult = await collectImagesForModel(item.model);
        const itemTitle = item.title || buildTitleFromInsights(vendor, item.model, analyzeDescription(item.description, item.model), S.titleFormat);
        const itemTags = item.tags.length > 0 ? item.tags : [vendor];
        const pubStatus = scheduleMode ? 'DRAFT' : 'ACTIVE';

        const result = await publishOneProduct({
          vendorName: vendor, productTitle: itemTitle, descriptionSource: item.description, descriptionIsHtml: S.descriptionIsHtml,
          typeValue: item.productType || FALLBACK_PRODUCT_TYPE, tagList: itemTags, skuValue: item.model,
          barcodeValue: 'USA', quantity: randomInventoryQuantity(), images: imageResult.images.slice(0, TARGET_IMAGE_COUNT),
          seoTitleValue: buildSeoTitleFromTitle(itemTitle, item.model), metaDescriptionValue: buildMetaDescription(item.description),
          handleValue: buildHandleFromTitle(itemTitle, item.model), pricingValue: randomPricing(),
          status: pubStatus,
        });

        if (result.error) { item.status = 'error'; item.message = result.error; }
        else {
          successCount++;
          if (scheduleMode) {
            const scheduleMode2 = document.getElementById('schedSpecific')?.checked;
            let publishAt;
            if (scheduleMode2) {
              const firstTime = new Date(document.getElementById('batchSpecificTime').value);
              if (!firstTime || isNaN(firstTime.getTime())) { toast('请选择首发时间'); S.batchRunning = false; $('btnBatchRun').disabled = false; $('batchProgress').style.display = 'none'; return; }
              const interval2 = parseInt(document.getElementById('batchInterval2')?.value || '5', 10);
              publishAt = new Date(firstTime.getTime() + i * interval2 * 60000).toISOString();
            } else {
              const intervalMin = parseInt($('batchInterval').value, 10);
              publishAt = new Date(Date.now() + (i + 1) * intervalMin * 60000).toISOString();
            }
            const key = S.shopKeys[shopIndex()];
            try {
              await callCloud('schedule', { key, productId: result.id, publicationIds: S.publicationIds, title: result.title, publishAt });
              item.status = 'success'; item.message = `⏰ ${intervalMin}分钟后上架`;
            } catch (e2) { item.status = 'warning'; item.message = '草稿创建成功，定时失败：' + e2.message; }
          } else {
            item.status = 'success'; item.message = result.warning ? `⚠️ ${result.warning}` : `已附图 ${Math.min(imageResult.images.length, TARGET_IMAGE_COUNT)} 张`;
            if (result.warning) item.status = 'warning';
          }
          item.handle = result.handle; item.title = result.title;
        }
        renderBatchTable();
      }

      $('batchProgressFill').style.width = '100%';
      $('batchProgress').style.display = 'none';
      $('batchProgressBar').style.display = 'none';
      if (successCount > 0) {
        const vw = await saveVendorMemory(vendor);
        const suffix = scheduleMode ? `，已加入定时队列，页面底部查看` : (vw ? `。${vw}` : '');
        $('batchNotice').textContent = `完成：成功 ${successCount}/${S.batchItems.length} 个${suffix}`;
        addVendorHistory(vendor);
        if (!scheduleMode) loadRecentProducts(null, 'forward');
        else loadQueue();
      } else {
        $('batchNotice').textContent = '完成：没有产品创建成功。';
      }
      S.batchRunning = false; $('btnBatchRun').disabled = false;
    }

    // ===== 模式切换 =====
    function onModeChange() {
      S.mode = $('mode').value;
      $('batchSection').style.display = S.mode === 'batch' ? 'block' : 'none';
      $('singleInputSection').style.display = S.mode === 'single' ? 'block' : 'none';
      if (S.mode === 'single' && S.contentVisible) { $('singleContentSection').style.display = 'block'; $('singlePreviewSection').style.display = 'block'; }
      else { $('singleContentSection').style.display = 'none'; $('singlePreviewSection').style.display = 'none'; }
    }
    function onTitleFormatChange() { S.titleFormat = $('titleFormat').value; }
    function onScheduleModeChange() {
      const isSpecific = document.getElementById('schedSpecific')?.checked;
      const opt1 = document.getElementById('schedIntervalOpts');
      const opt2 = document.getElementById('schedSpecificOpts');
      if (opt1) opt1.style.display = isSpecific ? 'none' : 'block';
      if (opt2) opt2.style.display = isSpecific ? 'block' : 'none';
    }
    function onDescFormatChange() { S.descriptionIsHtml = $('descFormat').value === 'html'; $('descFormatHint').textContent = S.descriptionIsHtml ? '当前为 HTML 模式：粘贴的 HTML 会原样写入。' : '当前为纯文本：只保留换行。'; }

    // ===== 批量编辑已发布产品 =====
    function getRecentChecked() {
      return Array.from(document.querySelectorAll('.recent-check:checked')).map(cb => ({ id: cb.dataset.id, sku: cb.dataset.sku || '' }));
    }
    function updateBulkSelCount() {
      const checked = document.querySelectorAll('.recent-check:checked').length;
      const bc = $('bulkSelCount'); if (bc) bc.textContent = checked;
      const btn = $('bulkEditBtn'); if (btn) btn.style.display = checked > 0 ? 'inline-block' : 'none';
      const head = $('selectAllRecentHead'); const top = $('selectAllRecent');
      const total = S.recentProducts.length;
      if (head) { if (total > 0 && checked === total) head.checked = true; else if (checked !== total) head.checked = false; }
      if (top) top.checked = head ? head.checked : false;
    }
    function bindRecentChecks() {
      document.querySelectorAll('.recent-check').forEach(cb => {
        cb.addEventListener('change', updateBulkSelCount);
      });
    }
    window.openBulkEdit = function() {
      const sel = getRecentChecked();
      if (sel.length === 0) { toast('请先勾选要编辑的产品'); return; }
      $('bulkCount').textContent = sel.length;
      $('bulkEditPanel').style.display = 'block';
      $('bulkImgOn').checked = true; $('bulkImgOpts').style.display = 'block';
      $('bulkTypeOn').checked = false; $('bulkType').style.display = 'none';
      $('bulkTagsOn').checked = false; $('bulkTagsOpts').style.display = 'none';
      $('bulkStatusOn').checked = false; $('bulkStatus').style.display = 'none';
      $('bulkDescOn').checked = false; $('bulkDescOpts').style.display = 'none';
      $('bulkUnifiedWrap').style.display = 'none';
      $('bulkEditPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.closeBulkEdit = function() { $('bulkEditPanel').style.display = 'none'; };
    function toggleBulkImgMode() {
      const mode = document.querySelector('input[name="bulkImgMode"]:checked');
      $('bulkUnifiedWrap').style.display = (mode && mode.value === 'unified') ? 'block' : 'none';
    }
    async function uploadBulkUnifiedImage() {
      const file = $('bulkUnifiedFile').files ? $('bulkUnifiedFile').files[0] : null;
      if (!file) return null;
      toast('上传统一图片中...');
      try { const r = await uploadImageFile(file); return { id: r.id, url: r.url, alt: file.name }; } catch (e) { toast('上传失败：' + e.message); return null; }
    }
    async function replaceProductImages(productId, searchKey, unified) {
      try {
        const mediaRes = await gqlWithRetry(PRODUCT_MEDIA_QUERY, { id: productId });
        if (mediaRes.errors && mediaRes.errors.length) return '读取媒体失败：' + formatErrors(mediaRes.errors);
        const mediaIds = (mediaRes.data && mediaRes.data.product && mediaRes.data.product.media ? mediaRes.data.product.media.edges : []).map(e => e.node ? e.node.id : null).filter(Boolean);
        if (mediaIds.length > 0) {
          const delRes = await gqlWithRetry(MEDIA_DELETE, { productId: productId, mediaIds: mediaIds });
          if (delRes.errors && delRes.errors.length) return '删除旧图失败：' + formatErrors(delRes.errors);
        }
        let imgs = [];
        if (unified) { imgs = [unified]; }
        else { const r = await collectImagesForModel(searchKey || productId); imgs = r.images || []; }
        if (imgs.length === 0) return '未找到替换图片';
        const media = imgs.slice(0, TARGET_IMAGE_COUNT).map(img => ({ originalSource: img.url, mediaContentType: 'IMAGE', alt: searchKey || 'product' }));
        const addRes = await gqlWithRetry(MEDIA_CREATE, { productId: productId, media: media });
        if (addRes.errors && addRes.errors.length) return '添加新图失败：' + formatErrors(addRes.errors);
        const ue = (addRes.data && addRes.data.productCreateMedia ? addRes.data.productCreateMedia.userErrors : []) || [];
        if (ue.length > 0) return '添加新图失败：' + formatUserErrors(ue);
        return '';
      } catch (e) { return '换图异常：' + (e.message || '未知'); }
    }
    async function runBulkEdit() {
      if (S.bulkRunning) return;
      const sel = getRecentChecked();
      if (sel.length === 0) { toast('没有选中的产品'); return; }
      const doImg = $('bulkImgOn').checked;
      const imgMode = (document.querySelector('input[name="bulkImgMode"]:checked') || {}).value || 'search';
      const doType = $('bulkTypeOn').checked;
      const typeVal = $('bulkType').value.trim();
      const doTags = $('bulkTagsOn').checked;
      const tagsVal = $('bulkTags').value.trim();
      const tagsAppend = $('bulkTagsAppend').checked;
      const doStatus = $('bulkStatusOn').checked;
      const statusVal = $('bulkStatus').value;
      const doDesc = $('bulkDescOn').checked;
      const descText = $('bulkDescInput').value;
      if (doDesc && !descText.trim()) { toast('请先粘贴描述文本'); return; }
      if (!doImg && !doType && !doTags && !doStatus && !doDesc) { toast('请至少勾选一个要修改的字段'); return; }
      if (doType && !typeVal) { toast('请填写产品类型'); return; }
      if (doTags && !tagsVal) { toast('请填写 Tags'); return; }
      let unified = null;
      if (doImg && imgMode === 'unified') { unified = await uploadBulkUnifiedImage(); if (!unified) return; }
      S.bulkRunning = true; $('bulkRunBtn').disabled = true;
      $('bulkProgress').style.display = 'flex'; $('bulkProgressBar').style.display = 'block';
      let ok = 0, fail = 0;
      const errMsgs = [];
      for (let i = 0; i < sel.length; i++) {
        const p = sel[i];
        $('bulkProgressText').textContent = '处理 ' + (i + 1) + '/' + sel.length + '…';
        $('bulkProgressFill').style.width = Math.round((i / sel.length) * 100) + '%';
        const pLabel = (p.title || '').substring(0, 30) || ('产品' + (i+1));
        try {
          // 描述解析模式：复用 parseBatchInput（--- 分隔），和批量发品逻辑一致
          if (doDesc) {
            const vendorName = p.vendor || S.vendor || 'Unknown';
            const { items: parsedItems } = parseBatchInput(descText, vendorName, S.titleFormat || 0);
            const item = parsedItems[i] || parsedItems[0];
            if (!item || !item.model) { fail++; errMsgs.push(pLabel + ': 无法从描述中解析型号'); continue; }
            const modelLine = item.model;
            const cleanDesc = item.description;
            const insights = analyzeDescription(cleanDesc || modelLine, modelLine);
            const titleValue = item.title || buildTitleFromInsights(vendorName, modelLine, insights, S.titleFormat || 0);
            const typeValue = item.productType || typeVal || insights.canonicalType || '';
            const tagsValue = item.tags || insights.tags;
            const seoTitleValue = buildSeoTitleFromTitle(titleValue, insights);
            const metaDescValue = buildMetaDescription(cleanDesc || modelLine, insights);
            const rawDesc = cleanDesc || '';
            const isHtmlContent = /<[a-z][\s>][^<]*>/i.test(rawDesc);
            const descHtml = isHtmlContent ? rawDesc : toHtml(rawDesc.replace(/<br\s*\/?\s*>/gi, '\n'), false);
            const handleValue = buildHandleFromTitle(titleValue, modelLine);
            const finalTitle = titleValue || p.title || '';
            const productInput = {
              title: finalTitle,
              descriptionHtml: descHtml,
              handle: handleValue || undefined,
              productType: typeValue || undefined,
              tags: tagsValue,
            };
            if (doStatus) productInput.status = statusVal;
            if (doTags) {
              let finalTags = parseTags((tagsValue || []).join(','));
              if (tagsAppend) {
                try { const tr = await gqlWithRetry(PRODUCT_TAGS_QUERY, { id: p.id }); const oldTags = (tr.data && tr.data.product && tr.data.product.tags) || []; for (const t of finalTags) { if (!oldTags.some(o => o.toLowerCase() === t.toLowerCase())) oldTags.push(t); } finalTags = oldTags; } catch (e2) {}
              }
              productInput.tags = finalTags;
            }
            const r = await gqlWithRetry(PRODUCT_UPDATE, { product: { id: p.id, ...productInput } });
            if (r.errors && r.errors.length) { const e = 'productUpdate系统错误: ' + JSON.stringify(r.errors); console.error(e); errMsgs.push(pLabel + ': ' + e); fail++; continue; }
            const ue = (r.data && r.data.productUpdate ? r.data.productUpdate.userErrors : []) || [];
            if (ue.length > 0) { const e = ue.map(u => u.message||JSON.stringify(u)).join('; '); errMsgs.push(pLabel + ': ' + e); fail++; continue; }
            try {
              if (seoTitleValue || metaDescValue) {
                await gqlWithRetry(METAFIELDS_SET, { metafields: [{ namespace: 'seo', key: 'title', valueType: 'STRING', value: seoTitleValue || finalTitle, ownerResource: 'PRODUCT', ownerId: p.id }, { namespace: 'seo', key: 'description', valueType: 'STRING', value: metaDescValue || '', ownerResource: 'PRODUCT', ownerId: p.id }] });
              }
            } catch(e5) { console.warn('SEO metafields warn:', e5.message); }
            ok++;
            continue;
          }

          // 单独换图
          if (doImg) { const msg = await replaceProductImages(p.id, p.sku, imgMode === 'unified' ? unified : null); if (msg) { errMsgs.push(pLabel + ': 换图失败: ' + msg); fail++; continue; } }

          // 单独字段更新
          const productInput = {};
          if (doType) productInput.productType = typeVal;
          if (doStatus) productInput.status = statusVal;
          if (doTags) {
            let finalTags = parseTags(tagsVal);
            if (tagsAppend) {
              try { const tr = await gqlWithRetry(PRODUCT_TAGS_QUERY, { id: p.id }); const oldTags = (tr.data && tr.data.product && tr.data.product.tags) || []; for (const t of finalTags) { if (!oldTags.some(o => o.toLowerCase() === t.toLowerCase())) oldTags.push(t); } finalTags = oldTags; } catch (e2) {}
            }
            productInput.tags = finalTags;
          }
          if (Object.keys(productInput).length > 0) {
            const r = await gqlWithRetry(PRODUCT_UPDATE, { product: { id: p.id, ...productInput } });
            if (r.errors && r.errors.length) { fail++; continue; }
            const ue = (r.data && r.data.productUpdate ? r.data.productUpdate.userErrors : []) || [];
            if (ue.length > 0) { fail++; continue; }
          }
          ok++;

        } catch (e3) { errMsgs.push(pLabel + ': 异常: ' + (e3.message || String(e3))); fail++; }
      }
      $('bulkProgressFill').style.width = '100%';
      $('bulkProgress').style.display = 'none'; $('bulkProgressBar').style.display = 'none';
      S.bulkRunning = false; $('bulkRunBtn').disabled = false;
      const errDiv = $('bulkErrors');
      if (errMsgs.length > 0) {
        errDiv.innerHTML = '<b>❌ 失败 ' + fail + ' 个：</b><br>' + errMsgs.join('<br>');
        errDiv.style.display = 'block';
      } else {
        errDiv.style.display = 'none';
        errDiv.innerHTML = '';
      }
      toast('批量编辑完成：成功 ' + ok + '，失败 ' + fail);
      loadRecentProducts(null, 'forward');
    }

    // ===== 定时队列 =====
    async function loadQueue() {
      try {
        const r = await callCloud('listQueue');
        const items = r.items || [];
        $('queueEmpty').style.display = items.length === 0 ? 'block' : 'none';
        $('queueList').innerHTML = items.map(it => {
          const badge = it.status === 'done' ? 'b-ok' : it.status === 'failed' ? 'b-err' : 'b-pending';
          const label = it.status === 'done' ? '已完成' : it.status === 'failed' ? '失败' : it.status === 'cancelled' ? '已取消' : '待发布';
          return `<div class="shop-item"><div class="shop-name">${esc(it.title || '单件商品')}</div><div class="shop-store">店铺：${esc(it.shopKey)} · ${esc(new Date(it.publishAt).toLocaleString())}</div><div class="row" style="align-items:center;"><span class="badge ${badge}">${label}</span>${it.status === 'pending' ? `<button class="btn btn-danger btn-mini" onclick="cancelQueue('${esc(it._id)}')">取消</button>` : ''}</div></div>`;
        }).join('');
      } catch (e) { toast('加载队列失败：' + e.message); }
    }
    window.cancelQueue = async function(id) { try { await callCloud('cancelQueue', { id }); loadQueue(); } catch (e) { toast('失败：' + e.message); } };
    window.clearDoneQueue = async function() {
      if (!confirm('确定清空所有已完成/失败/已取消的队列条目？')) return;
      try {
        const r = await callCloud('listQueue');
        const done = (r.items || []).filter(it => ['done','failed','cancelled'].includes(it.status));
        for (const it of done) { await callCloud('deleteQueue', { id: it._id }); }
        toast('已清空 ' + done.length + ' 条');
        loadQueue();
      } catch (e) { toast('清空失败：' + e.message); }
    };
    window.scheduleSingle = async function() {
      const model = $('model').value.trim(); const vendor = $('vendor').value.trim();
      const title = $('title').value.trim(); const desc = $('description').value.trim();
      const directives = parseDirectives(desc); const publishDesc = directives.cleanDescription;
      const publishTitle = title.length > 0 ? title : directives.title;
      if (!model || !vendor || !publishTitle || !publishDesc) { toast('请先填完整再定时'); return; }
      const timeVal = $('scheduleTime').value;
      if (!timeVal) { toast('请选择发布时间'); return; }
      const publishAt = new Date(timeVal).toISOString();
      if (new Date(publishAt) <= new Date()) { toast('时间必须在未来'); return; }
      const targetSku = $('sku').value.trim() || model;
      const dup = await checkSkuExists(targetSku);
      if (dup) { if (!confirm(`⚠️ SKU「${targetSku}」已发过：\n\n${dup.title}\n状态：${dup.status}\n\n还要继续吗？`)) return; }
      $('confirmScheduleBtn').disabled = true;
      try {
        const parsedTags = parseTags($('tags').value);
        const parsedQty = parseInt($('inventoryQuantity').value, 10);
        const resolvedQty = Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : randomInventoryQuantity();
        const result = await publishOneProduct({
          vendorName: vendor, productTitle: publishTitle, descriptionSource: publishDesc, descriptionIsHtml: S.descriptionIsHtml,
          typeValue: $('productType').value.trim() || directives.type || FALLBACK_PRODUCT_TYPE,
          tagList: parsedTags.length > 0 ? parsedTags : directives.tags.length > 0 ? directives.tags : [vendor],
          skuValue: targetSku, barcodeValue: $('barcode').value.trim() || 'USA',
          quantity: resolvedQty, images: S.selectedImages,
          seoTitleValue: $('seoTitle').value.trim(), metaDescriptionValue: $('metaDescription').value.trim(),
          handleValue: $('handle').value.trim(), pricingValue: S.pricing ?? randomPricing(),
          status: 'DRAFT',
        });
        if (result.error) { toast(result.error); $('confirmScheduleBtn').disabled = false; return; }
        const key = S.shopKeys[shopIndex()];
        await callCloud('schedule', { key, productId: result.id, publicationIds: S.publicationIds, title: result.title, publishAt });
        toast('定时发布已安排 ✓');
        $('scheduleWrap').style.display = 'none';
        $('confirmScheduleBtn').disabled = false;
        loadQueue();
      } catch (e) { toast('定时失败：' + e.message); $('confirmScheduleBtn').disabled = false; }
    };

    // ===== 店铺操作 =====
    window.getToken = async function(key) {
      try { const r = await callCloud('getToken', { key }); const token = r.token; if (token) { const ok = await copyText(token); if (ok) toast('令牌已复制到剪贴板 ✓'); else { toast('令牌已生成，但复制失败，请手动复制'); console.log('令牌:', token); } } else { toast('令牌已生成 ✓'); } loadShops(); } catch (e) { toast('生成失败：' + e.message); }
    };
    async function copyText(text) {
      text = String(text || '');
      if (navigator.clipboard?.writeText && window.isSecureContext) { try { await navigator.clipboard.writeText(text); return true; } catch {} }
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.top = '-9999px'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.focus(); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch {} document.body.removeChild(ta); return ok;
    }
    window.renameShop = async function(key) { const name = prompt('输入新备注名：', (S.shops.find(s => s.key === key) || {}).name || ''); if (name?.trim()) { try { await callCloud('updateShop', { key, name: name.trim() }); loadShops(); } catch (e) { toast('失败：' + e.message); } } };
    window.deleteShop = async function(key) { if (!confirm('确定删除这个店铺吗？')) return; try { await callCloud('deleteShop', { key }); loadShops(); } catch (e) { toast('失败：' + e.message); } };

    // ===== 事件绑定 =====
    function bindEvents() {
      $('restoreDraftBtn').addEventListener('click', restoreDraft);
      $('discardDraftBtn').addEventListener('click', discardDraft);
      $('toggleAddShop').addEventListener('click', () => { const f = $('addShopForm'); const willShow = f.style.display === 'none'; f.style.display = willShow ? 'block' : 'none'; $('toggleAddShop').textContent = willShow ? '🔼 收起添加店铺' : '➕ 添加店铺'; });
      $('shopToggle').addEventListener('click', () => { const wrap = $('shopListWrap'); const show = wrap.style.display === 'none'; wrap.style.display = show ? 'block' : 'none'; $('shopArrow').textContent = show ? '▾' : '▸'; });

      // ===== 批量上传图片事件 =====
      const dz = $('uploadDropzone');
      dz.addEventListener('click', () => $('uploadFileInput').click());
      $('uploadFileInput').addEventListener('change', (e) => { addUploadFiles(e.target.files); e.target.value = ''; });
      ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dz.classList.add('drag'); }));
      ['dragleave', 'dragend'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dz.classList.remove('drag'); }));
      dz.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); dz.classList.remove('drag'); addUploadFiles(e.dataTransfer.files); });
      document.addEventListener('paste', (e) => { const items = Array.from(e.clipboardData?.items || []).filter(it => it.type && it.type.startsWith('image/')); if (items.length === 0) return; const files = items.map(it => it.getAsFile()).filter(Boolean); if (files.length > 0) { e.preventDefault(); addUploadFiles(files); toast('已从剪贴板加入 ' + files.length + ' 张'); } });
      $('uploadStartBtn').addEventListener('click', runUpload);
      $('uploadClearBtn').addEventListener('click', clearUploadList);
      $('uploadOpenLibBtn').addEventListener('click', () => { const store = S.shopStores[parseInt($('uploadShopSelect').value || '0', 10)] || ''; if (store) window.open(`https://${store}/admin/content/files`, '_blank'); });
      $('uploadShopSelect').addEventListener('change', () => {});

      $('addShopBtn').addEventListener('click', async () => {
        const store = $('newStore').value.trim().toLowerCase(); const name = $('newName').value.trim(); const clientId = $('newClientId').value.trim(); const clientSecret = $('newSecret').value.trim();
        if (!store || !clientId || !clientSecret) { toast('域名、Client ID、Secret 都要填'); return; }
        let domain = store.endsWith('.myshopify.com') ? store : store + '.myshopify.com'; const key = domain.replace('.myshopify.com', '');
        try { await callCloud('addShop', { key, name: name || key, store: domain, clientId, clientSecret }); toast('店铺添加成功 ✓'); ['newStore','newName','newClientId','newSecret'].forEach(id => $(id).value = ''); $('addShopForm').style.display = 'none'; loadShops(); } catch (e) { toast('添加失败：' + e.message); }
      });

      $('shopSelect').addEventListener('change', () => { S.shopId = ''; S.locationId = ''; S.publications = []; S.publicationIds = []; S.categories = []; S.categoryId = ''; S.vendor = ''; renderPublications(); renderBanners(); bootstrapShop(); });
      $('toggleSettings').addEventListener('click', () => { const p = $('settingsPanel'); const willShow = p.style.display === 'none'; p.style.display = willShow ? 'block' : 'none'; $('toggleSettings').textContent = willShow ? '收起' : '展开'; });
      $('mode').addEventListener('change', onModeChange);
      $('titleFormat').addEventListener('change', onTitleFormatChange);
      $('descFormat').addEventListener('change', onDescFormatChange);
      $('btnCatSearch').addEventListener('click', () => { const term = $('categorySearch').value.trim(); if (term) loadCategories(term); });
      $('pubSelectAll').addEventListener('click', () => { S.publicationIds = S.publications.map(p => p.id); renderPublications(); });
      $('pubSelectNone').addEventListener('click', () => { S.publicationIds = []; renderPublications(); });

      $('startFillBtn').addEventListener('click', startFilling);
      $('generateBtn').addEventListener('click', generateFromDescription);
      $('model').addEventListener('change', refreshPreviewIfModelChanged);
      $('btnImgSearch').addEventListener('click', runManualSearch);
      $('createBtn').addEventListener('click', createProduct);
      $('btnUploadImage').addEventListener('click', () => $('imageUploadInput').click());
      $('imageUploadInput').addEventListener('change', async (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        if (S.selectedImages.length >= TARGET_IMAGE_COUNT) { toast('最多选 ' + TARGET_IMAGE_COUNT + ' 张图'); e.target.value = ''; return; }
        toast('上传中...');
        try { const uploaded = await uploadImageFile(file); S.selectedImages.push(uploaded); renderImages(); toast('上传成功 ✓'); }
        catch (err) { S.imageError = err.message; renderBanners(); toast(err.message); }
        e.target.value = '';
      });
      $('scheduleBtn').addEventListener('click', () => { const wrap = $('scheduleWrap'); const willShow = wrap.style.display === 'none'; wrap.style.display = willShow ? 'block' : 'none'; });
      $('confirmScheduleBtn').addEventListener('click', () => scheduleSingle());
      document.querySelectorAll('.quick-dates button[data-hours]').forEach(btn => btn.addEventListener('click', () => {
        const hours = parseInt(btn.dataset.hours, 10); const now = new Date();
        if (hours === 24) now.setDate(now.getDate() + 1); else now.setHours(now.getHours() + hours);
        const pad = (n) => String(n).padStart(2, '0');
        const local = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
        $('scheduleTime').value = local;
      }));

      $('parseBatchBtn').addEventListener('click', parseBatch);
      $('clearBatchBtn').addEventListener('click', clearBatch);
      $('btnBatchRun').addEventListener('click', runBatch);
      $('batchScheduleOn').addEventListener('change', function() {
        $('batchScheduleOpts').style.display = this.checked ? 'block' : 'none';
        $('btnBatchRun').textContent = this.checked ? '✅ 加入定时队列' : '✅ 批量创建并上架';
      });
      $('batchScheduleWrap').style.display = 'block';

      $('refreshRecentBtn').addEventListener('click', () => { $('recentSearchInput').value = ''; S.recentSearchQuery = ''; loadRecentProducts(null, 'forward'); });
      $('prevPageBtn').addEventListener('click', () => { if (S.recentPageInfo && S.recentPageInfo.hasPreviousPage) loadRecentProducts(S.recentPageInfo.startCursor, 'backward'); });
      $('nextPageBtn').addEventListener('click', () => { if (S.recentPageInfo && S.recentPageInfo.hasNextPage) loadRecentProducts(S.recentPageInfo.endCursor, 'forward'); });
      $('refreshQueueBtn').addEventListener('click', loadQueue);
      $('bulkEditBtn').addEventListener('click', openBulkEdit);
      $('bulkCloseBtn').addEventListener('click', closeBulkEdit);
      $('bulkRunBtn').addEventListener('click', runBulkEdit);
      $('bulkImgOn').addEventListener('change', function() { $('bulkImgOpts').style.display = this.checked ? 'block' : 'none'; });
      Array.from(document.getElementsByName('bulkImgMode')).forEach(r => r.addEventListener('change', toggleBulkImgMode));
      $('bulkTypeOn').addEventListener('change', function() { $('bulkType').style.display = this.checked ? 'block' : 'none'; });
      $('bulkTagsOn').addEventListener('change', function() { $('bulkTagsOpts').style.display = this.checked ? 'block' : 'none'; });
      $('bulkStatusOn').addEventListener('change', function() { $('bulkStatus').style.display = this.checked ? 'block' : 'none'; });
      $('bulkDescOn').addEventListener('change', function() { $('bulkDescOpts').style.display = this.checked ? 'block' : 'none'; });
      $('selectAllRecent').addEventListener('change', function() { document.querySelectorAll('.recent-check').forEach(cb => { cb.checked = this.checked; }); updateBulkSelCount(); });
      $('selectAllRecentHead').addEventListener('change', function() { document.querySelectorAll('.recent-check').forEach(cb => { cb.checked = this.checked; }); updateBulkSelCount(); });
      $('recentSearchInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') { const q = e.target.value.trim(); if (q) searchRecentProducts(q); } });

      $('vendor').addEventListener('focus', () => showVendorList('vendor', 'vendorList'));
      $('vendor').addEventListener('blur', () => hideVendorList('vendorList'));
      $('batchVendor').addEventListener('focus', () => showVendorList('batchVendor', 'batchVendorList'));
      $('batchVendor').addEventListener('blur', () => hideVendorList('batchVendorList'));

      // 输入框同步到状态
      ['model','vendor','title','description','sku','productType','barcode','inventoryQuantity','tags','seoTitle','metaDescription','handle'].forEach(id => {
        const el = $(id); if (el) el.addEventListener('input', () => { S[id] = el.value; if (['model','title','description','sku','productType','barcode','inventoryQuantity','tags','seoTitle','metaDescription','handle'].includes(id)) saveDraft(); });
      });
      $('seoTitle').addEventListener('input', () => $('seoLen').textContent = `（${$('seoTitle').value.length} 字符）`);
      $('metaDescription').addEventListener('input', () => $('metaLen').textContent = `（${$('metaDescription').value.length} 字符）`);
      $('batchVendor').addEventListener('input', () => { S.vendor = $('batchVendor').value; });
      $('batchInput').addEventListener('input', () => { S.batchInput = $('batchInput').value; });
    }

    // ===== 启动 =====
    (async function boot() {
      // 先做不依赖云开发的 UI 初始化，让界面立刻可用
      bindEvents();
      onDescFormatChange();
      checkDraft();
      renderUploadList();
      // 云开发 SDK 后台异步加载（902KB，不阻塞首屏）
      try {
        await initCloud();
        loadShops();
        loadQueue();
        setInterval(tickTokenTimers, 1000);
        setInterval(loadQueue, 30000);
        initDedup();
      } catch (e) {
        console.warn('云开发初始化失败:', e);
        toast('云开发加载失败，发品功能暂不可用');
      }
    })();

    // ============================================================
    // ⑤ 批量查重
    // ============================================================
    const DUP_INDEX_QUERY = `query DupIndex($first: Int!, $after: String) { products(first: $first, after: $after, sortKey: CREATED_AT, reverse: true) { edges { node { id title handle variants(first: 100) { edges { node { sku } } } } } pageInfo { hasNextPage endCursor } } }`;
    const DUP_PAGE = 100;
    let dupIndex = { key: '', products: [], fetchedAt: 0 }; // 内存索引：{ title, handle, skus: [] }

    function initDedup() {
      const runBtn = $('dupRunBtn');
      const refreshBtn = $('dupRefreshBtn');
      if (!runBtn) return;
      runBtn.addEventListener('click', runDedup);
      refreshBtn.addEventListener('click', async () => { dupIndex = { key: '', products: [], fetchedAt: 0 }; toast('索引已清除，重新拉取中…'); await runDedup(); });
      // 店铺切换时更新显示
      const sel = $('shopSelect');
      if (sel) sel.addEventListener('change', () => { dupIndex = { key: '', products: [], fetchedAt: 0 }; updateDupShopName(); });
      updateDupShopName();
    }

    function updateDupShopName() {
      const el = $('dupShopName');
      if (!el) return;
      const sel = $('shopSelect');
      const name = sel && sel.selectedOptions[0] ? sel.selectedOptions[0].textContent.trim() : '当前店铺';
      el.textContent = name;
    }

    // 拉取店铺全量产品索引（分页，缓存）
    async function ensureDupIndex(key) {
      if (dupIndex.key === key && dupIndex.products.length > 0) return dupIndex.products;
      const prog = $('dupProgress'); const progText = $('dupProgressText');
      if (prog) { prog.style.display = 'flex'; if (progText) progText.textContent = '⏳ 正在拉取店铺产品索引…'; }
      const all = [];
      let cursor = null, page = 0;
      try {
        do {
          page++;
          const result = await gqlWithRetry(DUP_INDEX_QUERY, { first: DUP_PAGE, after: cursor }, key);
          if (result.errors?.length) throw new Error(formatErrors(result.errors));
          const edges = result.data?.products?.edges ?? [];
          for (const edge of edges) {
            const node = edge.node;
            const skus = (node.variants?.edges ?? []).map(v => (v.node?.sku || '').trim()).filter(Boolean);
            all.push({ id: node.id, title: node.title || '', handle: node.handle || '', skus });
          }
          if (progText) progText.textContent = `⏳ 已拉取 ${all.length} 个产品…`;
          const pageInfo = result.data?.products?.pageInfo;
          cursor = pageInfo?.hasNextPage ? pageInfo.endCursor : null;
          if (page > 200) break; // 防呆：最多 2 万产品
        } while (cursor);
        dupIndex = { key, products: all, fetchedAt: Date.now() };
        if (progText) progText.textContent = `✅ 索引就绪：${all.length} 个产品`;
        return all;
      } catch (err) {
        if (progText) progText.textContent = '❌ 索引拉取失败：' + (err?.message || err);
        throw err;
      } finally {
        setTimeout(() => { if (prog) prog.style.display = 'none'; }, 1500);
      }
    }

    // 查重模式：sku=完全一致；title=标题包含；both=两者同时命中
    function matchProduct(model, product, mode) {
      const m = String(model || '').trim().toUpperCase();
      if (!m) return false;
      const skuHit = product.skus.some(s => String(s).toUpperCase() === m);
      const titleHit = product.title.toUpperCase().includes(m);
      if (mode === 'sku') return skuHit;
      if (mode === 'title') return titleHit;
      if (mode === 'both') return skuHit && titleHit;
      return skuHit;
    }

    async function runDedup() {
      const input = $('dupInput'); const resultEl = $('dupResult'); const statusEl = $('dupStatus');
      const raw = (input?.value || '').trim();
      if (!raw) { toast('请先输入型号'); return; }
      const models = raw.split(/[\n\r,\uFF0C]+/).map(s => s.trim()).filter(Boolean);

      if (!models.length) { toast('未识别到型号'); return; }
      const mode = (document.querySelector('input[name="dupMode"]:checked') || {}).value || 'sku';
      const key = S.shopKeys[shopIndex()];
      if (!key) { toast('请先选择目标店铺'); return; }
      if (statusEl) statusEl.textContent = '';
      resultEl.innerHTML = '<div class="hint">⏳ 拉取店铺索引…</div>';
      try {
        const products = await ensureDupIndex(key);
        resultEl.innerHTML = '<div class="hint">⏳ 正在比对 ' + models.length + ' 个型号…</div>';
        await new Promise(r => setTimeout(r, 30)); // 让渲染先出来
        const found = [], notFound = [];
        for (const model of models) {
          const hits = products.filter(p => matchProduct(model, p, mode));
          if (hits.length > 0) found.push({ model, hits });
          else notFound.push(model);
        }
        renderDupResult(resultEl, models, found, notFound, mode);
      } catch (err) {
        resultEl.innerHTML = '<div class="hint error">❌ ' + esc(err?.message || err) + '</div>';
      }
    }

    function renderDupResult(el, models, found, notFound, mode) {
      const modeName = { sku: 'SKU 完全一致', title: '标题包含', both: 'SKU+标题同时命中' }[mode] || mode;
      let html = '<div class="dup-summary">';
      html += '<span class="badge b-ok">已发过 ' + found.length + '</span> ';
      html += '<span class="badge b-muted">未发过 ' + notFound.length + '</span> ';
      html += '<span class="badge b-info">模式：' + modeName + '</span>';
      html += '</div>';
      html += '<div class="row" style="margin-top:10px;">';
      html += '<button class="btn btn-ghost btn-mini" id="dupCopyFound">📋 复制已发过 (' + found.length + ')</button>';
      html += '<button class="btn btn-primary btn-mini" id="dupCopyNotFound">📋 复制未发过 (' + notFound.length + ')</button>';
      html += '</div>';
      // 已发过列表（可折叠）
      if (found.length) {
        html += '<div class="dup-section"><div class="dup-head" data-fold><span>✅ 已发过的型号</span><span class="dup-arrow">▼</span></div>';
        html += '<div class="dup-body">';
        for (const item of found) {
          html += '<div class="dup-item"><b>' + esc(item.model) + '</b>';
          for (const hit of item.hits.slice(0, 3)) {
            html += '<div class="dup-hit">→ <a href="https://' + esc(S.shops[keyForDup()]?.store || '') + '/products/' + esc(hit.handle) + '" target="_blank" rel="noopener">' + esc(hit.title) + '</a></div>';
          }
          if (item.hits.length > 3) html += '<div class="dup-hit" style="color:var(--soft);">… 共 ' + item.hits.length + ' 个匹配</div>';
          html += '</div>';
        }
        html += '</div></div>';
      }
      // 未发过列表（默认展开）
      if (notFound.length) {
        html += '<div class="dup-section open"><div class="dup-head" data-fold><span>🆕 未发过的型号</span><span class="dup-arrow">▼</span></div>';
        html += '<div class="dup-body">';
        for (const m of notFound) html += '<div class="dup-item">' + esc(m) + '</div>';
        html += '</div></div>';
      }
      el.innerHTML = html;
      // 折叠交互（事件委托）
      el.querySelectorAll('.dup-head[data-fold]').forEach(head => {
        head.addEventListener('click', () => head.parentNode.classList.toggle('open'));
      });
      // 复制按钮
      const cf = $('dupCopyFound'); const cnf = $('dupCopyNotFound');
      if (cf) cf.addEventListener('click', () => copyModels(found.map(f => f.model), cf));
      if (cnf) cnf.addEventListener('click', () => copyModels(notFound, cnf));
      // 状态栏
      const statusEl = $('dupStatus');
      if (statusEl) statusEl.textContent = '索引 ' + dupIndex.products.length + ' 个产品 · ' + new Date(dupIndex.fetchedAt).toLocaleTimeString('zh-CN');
    }

    function keyForDup() { return dupIndex.key; }

    function copyModels(models, btn) {
      if (!models.length) { toast('没有可复制的型号'); return; }
      navigator.clipboard.writeText(models.join('\n')).then(() => {
        btn.textContent = '✅ 已复制 ' + models.length + ' 个';
        setTimeout(() => { btn.textContent = btn.id === 'dupCopyFound' ? ('📋 复制已发过 (' + models.length + ')') : ('📋 复制未发过 (' + models.length + ')'); }, 2000);
      }).catch(() => {
        // 兜底：textarea 复制
        const ta = document.createElement('textarea');
        ta.value = models.join('\n'); document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); btn.textContent = '✅ 已复制'; } catch(e) { toast('复制失败，请手动选择'); }
        document.body.removeChild(ta);
      });
    }
  