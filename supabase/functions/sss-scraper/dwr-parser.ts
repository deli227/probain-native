// Parser pour les réponses DWR (Direct Web Remoting)
// Le site SSS utilise DWR pour communiquer avec le backend

export interface DWRResult {
  rows: any[];
  sendingRows: number;
  totalRows: number;
}

export interface DWRResponse {
  createdEntities: any[];
  deletedEntities: any[];
  returnValue: DWRResult;
  updatedEntities: any[];
}

/**
 * Parse une réponse DWR et extrait les données
 */
export function parseDWRResponse(response: string): DWRResponse | null {
  try {
    // La réponse DWR contient du JavaScript qui appelle dwr.engine.remote.handleCallback
    // Format: dwr.engine.remote.handleCallback("3","0",{...data...})

    // Extraire le JSON entre les parenthèses
    const callbackMatch = response.match(/handleCallback\([^,]+,[^,]+,(.+)\)\s*;?\s*\}\)\(\);/s);

    if (!callbackMatch) {
      console.error('❌ Impossible de trouver handleCallback dans la réponse DWR');
      return null;
    }

    const jsonString = callbackMatch[1];

    // Nettoyer le JSON (remplacer les références DWR si nécessaire)
    const cleanedJson = cleanDWRJson(jsonString);

    // Parser le JSON
    const parsed = JSON.parse(cleanedJson);

    // Extraire les données selon la structure DWR
    if (parsed.returnValue) {
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('❌ Erreur lors du parsing DWR:', error);
    return null;
  }
}

/**
 * Nettoie le JSON DWR en remplaçant les références et notations spéciales
 */
function cleanDWRJson(jsonString: string): string {
  let cleaned = jsonString;

  // Remplacer dwr.engine.remote.newObject("Type", {...}) par juste l'objet
  cleaned = cleaned.replace(/dwr\.engine\.remote\.newObject\([^,]+,\s*({[^}]*})\)/g, '$1');

  // Remplacer dwr.engine.remote.newObject("DwrResult",{...}) par l'objet directement
  cleaned = cleaned.replace(/dwr\.engine\.remote\.newObject\("DwrResult",\s*(\{[\s\S]*\})\)/g, '$1');

  return cleaned;
}

/**
 * Construit une requête DWR pour rechercher des cours
 */
export function buildDWRSearchRequest(params: {
  entityName?: string;
  columns?: string[];
  offset?: number;
  limit?: number;
  listForm?: string;
  searchForm?: string;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  scriptSessionId?: string;
}): string {
  const {
    entityName = 'Event',
    columns = ['abbreviation', 'label', 'first_course_date', 'status'],
    offset = 0,
    limit = 100,
    listForm = 'EventRegistration_module_list',
    searchForm = 'Event_search',
    orderBy = 'abbreviation',
    orderDirection = 'ASC',
    scriptSessionId = 'DWR-SESSION-ID'
  } = params;

  // Construire les références pour les colonnes
  const columnRefs = columns.map((col, idx) => `c0-e${idx + 3}=string:${col}`).join('\n');
  const columnRefsArray = columns.map((_, idx) => `reference:c0-e${idx + 3}`).join(',');

  const baseIdx = columns.length + 3;

  const request = `callCount=1
c0-scriptName=nice2_netui_SearchService
c0-methodName=search
c0-id=0
c0-param0=array:[]
c0-e1=array:[]
${columnRefs}
c0-e2=array:[${columnRefsArray}]
c0-e${baseIdx}=number:${offset}
c0-e${baseIdx + 1}=number:${limit}
c0-e${baseIdx - 1}=Object_searchService.Paging:{offset:reference:c0-e${baseIdx}, limit:reference:c0-e${baseIdx + 1}}
c0-e${baseIdx + 3}=string:${listForm}
c0-e${baseIdx + 4}=string:list
c0-e${baseIdx + 2}=Object_form.FormIdentifier:{formName:reference:c0-e${baseIdx + 3}, scope:reference:c0-e${baseIdx + 4}}
c0-e${baseIdx + 6}=string:${searchForm}
c0-e${baseIdx + 7}=string:search
c0-e${baseIdx + 5}=Object_form.FormIdentifier:{formName:reference:c0-e${baseIdx + 6}, scope:reference:c0-e${baseIdx + 7}}
c0-e${baseIdx + 8}=null:null
c0-e${baseIdx + 9}=null:null
c0-e${baseIdx + 10}=string:${entityName}
c0-e${baseIdx + 11}=array:[]
c0-e${baseIdx + 12}=null:null
c0-e${baseIdx + 13}=array:[]
c0-e${baseIdx + 14}=boolean:true
c0-e${baseIdx + 17}=string:${orderBy}
c0-e${baseIdx + 18}=string:${orderDirection}
c0-e${baseIdx + 16}=Object_searchService.OrderItem:{path:reference:c0-e${baseIdx + 17}, direction:reference:c0-e${baseIdx + 18}}
c0-e${baseIdx + 15}=array:[reference:c0-e${baseIdx + 16}]
c0-e${baseIdx + 19}=null:null
c0-param1=Object_nice2.netui.SearchParameters:{queryParams:reference:c0-e1, columns:reference:c0-e2, paging:reference:c0-e${baseIdx - 1}, listForm:reference:c0-e${baseIdx + 2}, searchForm:reference:c0-e${baseIdx + 5}, constrictionParams:reference:c0-e${baseIdx + 8}, relatedTo:reference:c0-e${baseIdx + 9}, entityName:reference:c0-e${baseIdx + 10}, pks:reference:c0-e${baseIdx + 11}, manualQuery:reference:c0-e${baseIdx + 12}, searchFilters:reference:c0-e${baseIdx + 13}, skipDefaultDisplay:reference:c0-e${baseIdx + 14}, order:reference:c0-e${baseIdx + 15}, searchFilter:reference:c0-e${baseIdx + 19}}
batchId=1
instanceId=0
page=%2FCalendrier-des-Cours
scriptSessionId=${scriptSessionId}`;

  return request;
}

/**
 * Fait une requête DWR vers le serveur SSS
 */
export async function makeDWRRequest(
  url: string,
  requestBody: string,
  headers?: Record<string, string>
): Promise<DWRResponse | null> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Accept': '*/*',
        'Referer': 'https://formation.sss.ch/Calendrier-des-Cours',
        'Origin': 'https://formation.sss.ch',
        ...headers
      },
      body: requestBody
    });

    if (!response.ok) {
      console.error(`❌ Erreur HTTP: ${response.status} ${response.statusText}`);
      return null;
    }

    const responseText = await response.text();
    return parseDWRResponse(responseText);

  } catch (error) {
    console.error('❌ Erreur lors de la requête DWR:', error);
    return null;
  }
}
