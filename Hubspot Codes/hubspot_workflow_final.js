// --- Config ---
const LIST_ID = 1427; // renseigne l'ID numérique de ta liste (v3 /objectLists/{id}), ou laisse null

const EMAIL_RE = /<?([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})>?/i;

// -------- Helpers parsing --------
function splitGuestsBlock(raw) {
  if (!raw) return [];
  let txt = String(raw).replace(/\r\n?/g, "\n").replace(/[|]+/g, "\n");
  return txt.split("\n").map(l => l.trim()).filter(Boolean);
}

function parseGuestLine(line) {
  if (!line) return null;
  const semi = line.split(";").map(s => s.trim()).filter(Boolean);
  if (semi.length === 3 && EMAIL_RE.test(semi[2])) {
    return { firstname: semi[0], lastname: semi[1], email: semi[2].match(EMAIL_RE)[1].toLowerCase() };
  }
  const em = line.match(EMAIL_RE);
  if (!em) return null;
  const email = em[1].toLowerCase();

  let namePart = line
    .replace(EMAIL_RE, "")
    .replace(/[<>]/g, " ")
    .replace(/[;,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!namePart) return { firstname: email.split("@")[0], lastname: "", email };
  const tokens = namePart.split(" ").filter(Boolean);
  if (tokens.length === 1) return { firstname: tokens[0], lastname: "", email };
  const lastname = tokens[tokens.length - 1];
  const firstname = tokens.slice(0, -1).join(" ");
  return { firstname, lastname, email };
}

// -------- Main --------
exports.main = async (event, callback) => {
  // 1) Secret : process.env uniquement (nom exact dans l'UI = HUBSPOT_TOKEN)
  const token =
    (typeof process !== 'undefined' && process.env && process.env.HUBSPOT_TOKEN) ||
    null;

  // Log masqué pour diagnostiquer
  console.log("DEBUG_TOKEN_PRESENT", !!token, token ? (String(token).slice(0,4) + "*** len=" + String(token).length) : "NONE");
  if (!token) {
    return callback({
      outputFields: {
        parsed_count: 0,
        created_or_updated: 0,
        error_count: 1,
        errors_json: '["missing_secret:HUBSPOT_TOKEN"]'
      }
    });
  }

  const hubspot = require('@hubspot/api-client');
  const hs = new hubspot.Client({ accessToken: token });

  // 2) 🔎 PING d'auth — on vérifie que le token marche DANS CE WORKFLOW
  try {
    // Appel simple public : 1er contact (peu importe qu'il existe)
    const ping = await hs.apiRequest({
      method: 'GET',
      path: '/crm/v3/objects/contacts?limit=1'
    });
    console.log("DEBUG_AUTH_PING_STATUS", ping.status);
    if (ping.status < 200 || ping.status >= 300) {
      throw new Error(`auth_ping_${ping.status}`);
    }
  } catch (e) {
    // On arrête net avec un message explicite (tu le verras dans la sortie)
    return callback({
      outputFields: {
        parsed_count: 0,
        created_or_updated: 0,
        error_count: 1,
        errors_json: JSON.stringify([`auth_ping_failed: ${e?.message || e}`]).slice(0, 1900)
      }
    });
  }

  const hostId = event.object && event.object.objectId;
  const inputs = event.inputFields || {};
  console.log("DEBUG_input_keys", Object.keys(inputs || {}));

  // Les clés à gauche dans "Propriété à inclure dans le code" doivent matcher EXACTEMENT
  const block =
    inputs['vos_invites'] ||
    inputs['your_guests'] ||
    inputs['Vos_Invites'] ||
    inputs['Your guests'] ||
    "";

  console.log("DEBUG_block", (block || "").slice(0, 300));

  const lines  = splitGuestsBlock(block);
  const parsed = lines.map(parseGuestLine).filter(Boolean);
  console.log("DEBUG_parsed_count", parsed.length);

  let createdOrUpdated = 0;
  const errs = [];
  const guestEmails = [];
  const guestIds = []; // v3 Lists: on ajoute par IDs de contacts

  // -------- Récupère le nom de l'hôte (contact d'origine) --------
  let hostName = "inconnu";
  try {
    if (hostId) {
      const host = await hs.crm.contacts.basicApi.getById(hostId, ['firstname','lastname','email']);
      const p = host?.properties || {};
      hostName = [p.firstname, p.lastname].filter(Boolean).join(' ').trim() || p.email || `contact:${hostId}`;
    }
  } catch (e) {
    console.log("DEBUG_host_lookup_failed", e?.message || e);
  }

  // -------- Helper: créer une note associée au contact --------
  async function addNoteToContact(contactId, body) {
    const resp = await fetch('https://api.hubapi.com/engagements/v1/engagements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engagement: { active: true, type: 'NOTE', timestamp: Date.now() },
        associations: { contactIds: [contactId] },
        metadata: { body }
      })
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`note_create ${resp.status}: ${t}`);
    }
  }

  // Helpers via SDK
  async function searchByEmail(email) {
    const res = await hs.crm.contacts.searchApi.doSearch({
      filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
      properties: ['email']
    });
    return (res.results && res.results[0] && res.results[0].id) ? res.results[0].id : null;
  }
  async function createContact(props) {
    const res = await hs.crm.contacts.basicApi.create({ properties: props });
    return res.id;
  }
  async function updateContact(id, props) {
    await hs.crm.contacts.basicApi.update(id, { properties: props });
    return id;
  }
  async function updateHostProperty(updates) {
    if (!hostId) return;
    await hs.crm.contacts.basicApi.update(hostId, { properties: updates });
  }

  // 3) Upsert des invités
  for (const g of parsed) {
    try {
      const props = { email: g.email, lifecyclestage: 'subscriber' };
      if (g.firstname) props.firstname = g.firstname;
      if (g.lastname)  props.lastname  = g.lastname;

      const existingId = await searchByEmail(g.email);
      let contactId;
      if (existingId) contactId = await updateContact(existingId, props);
      else contactId = await createContact(props);

      // ➜ Ajoute une note indiquant le contact d'origine (hôte)
      try {
        const noteBody = `Créé/mis à jour automatiquement depuis la liste d'invités. Contact d'origine : ${hostName}.`;
        await addNoteToContact(contactId, noteBody);
      } catch (e) {
        errs.push(`${g.email}: note_failed: ${e?.message || e}`);
      }

      createdOrUpdated++;
      guestEmails.push(g.email);
      guestIds.push(String(contactId)); // pour l'ajout à la liste v3
    } catch (e) {
      errs.push(`${g.email}: ${e?.message || e}`);
    }
  }

  // 4) Ajout direct à la liste statique (Lists v3) - SANS vérification préalable
  if (LIST_ID && guestIds.length) {
    try {
      // Tentative directe d'ajout sans vérification de la liste
      // Si la liste n'accepte pas les ajouts manuels, l'API retournera une erreur explicite
      const add = await fetch(`https://api.hubapi.com/crm/v3/lists/${LIST_ID}/memberships/add`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([...new Set(guestIds)])
      });
      
      if (!add.ok) {
        const t = await add.text();
        const errorData = JSON.parse(t);
        
        // Gestion spécifique des erreurs
        if (add.status === 403 && errorData.message && errorData.message.includes('scopes')) {
          errs.push(`add_to_list: missing_scope_permission - contact your admin to add crm.lists.write scope`);
        } else if (add.status === 400 && errorData.message && errorData.message.includes('processing type')) {
          errs.push(`add_to_list: list_does_not_support_manual_additions - list processing type not supported`);
        } else if (add.status === 404) {
          errs.push(`add_to_list: list_not_found - list ID ${LIST_ID} does not exist or you don't have access`);
        } else {
          errs.push(`add_to_list: ${add.status}: ${t}`);
        }
      } else {
        console.log(`DEBUG_list_add_success: added ${guestIds.length} contacts to list ${LIST_ID}`);
      }
    } catch (e) {
      errs.push(`add_to_list: ${e?.message || e}`);
    }
  }

  // 5) Mise à jour de l'hôte
  try {
    const updates = {
      invites_error_count: errs.length,
      invites_count_created: createdOrUpdated,
      invites_parse_status: errs.length > 0 ? 'error' : 'processed'
    };
    // N'ajoute invites_parse_errors que si la propriété existe chez toi
    // (une fois créée, dé-commente la ligne ci-dessous)
    // updates.invites_parse_errors = errs.length > 0 ? JSON.stringify(errs).slice(0, 1900) : '';

    await updateHostProperty(updates);
  } catch (e) {
    errs.push(`host_update: ${e?.message || e}`);
  }

  // 6) Sorties pour logs
  callback({
    outputFields: {
      parsed_count: parsed.length,
      created_or_updated: createdOrUpdated,
      error_count: errs.length,
      errors_json: JSON.stringify(errs).slice(0, 1900)
    }
  });
};

