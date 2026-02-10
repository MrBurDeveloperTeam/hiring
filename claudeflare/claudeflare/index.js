import { APP_CONFIG } from "./config/apps.js";
import { parseJwtPayload, extractEmail } from "./auth/odooJwt.js";
import { getProfileByEmail } from "./supabase/profile.js";
// import { getInventoryMetaByUserId } from "./supabase/inventoryMeta.js";
// import { supabaseBootstrapByEmail } from "./supabase/bootstrap.js";
// import { inventoryFullSync } from "./supabase/inventorySync.js";
// import { getAppointments, updateAppointment, deleteAppointment, createAppointment } from "./supabase/appointments.js";
// import { searchPatients, createPatient, getPatients, updatePatient, deletePatient } from "./supabase/patients.js";
// import { getStaff, createStaff, updateStaff, deleteStaff } from "./supabase/staff.js";
// import { getRooms, createRoom, updateRoom, deleteRoom } from "./supabase/rooms.js";
// import { getTreatments, createTreatment, updateTreatment, deleteTreatment } from "./supabase/treatments.js";
// import { getSettings, saveSettings } from "./supabase/settings.js";
// import { getHolidays, addHoliday, updateHoliday, deleteHoliday } from "./supabase/holidays.js";
// import { getActivity, addActivity } from "./supabase/activity.js";
// import { handleWhiteboardApi } from "./supabase/whiteboard.js";
// import { handleTasksApi } from "./supabase/tasks.js";
// import { getRequests, updateRequest } from "./supabase/requests.js";
// import { getClinics, getClinicById, addClinic, updateClinic, deleteClinic } from "./supabase/clinics.js";
// import { getProfiles, getProfileById, updateProfile } from "./supabase/apt_profiles.js";
import { handleHiringApi } from "./supabase/hiring.js";


export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ==============================
    // ✅ COOKIE CONFIG (SHARED ACROSS SUBDOMAINS)
    // ==============================
    const COOKIE_NAME = "mrbur_sso";
    const COOKIE_DOMAIN = ".mrburstudio.com"; // ✅ shared across all subdomains
    const DEFAULT_MAX_AGE = 60 * 60; // 1 hour

    // ==============================
    // ✅ CORS
    // ==============================
    const origin = request.headers.get("Origin");
    const allowedOrigins = new Set([
      "https://inventory.mrburstudio.com",
      "https://appointment.mrburstudio.com",
      "https://event.mrburstudio.com",
      "https://recruitment.mrburstudio.com",
      "http://localhost:3000",
      "http://localhost:5173",
    ]);

    const isApi = url.pathname.startsWith("/api/");

    // NOTE: for cookies, Origin MUST be echoed (not "*")
    const corsHeaders = isApi
      ? {
        "Access-Control-Allow-Origin": allowedOrigins.has(origin)
          ? origin
          : "https://inventory.mrburstudio.com",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers":
          "Authorization, Content-Type, Accept, X-Requested-With",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      }
      : {};

    // Preflight
    if (isApi && request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ==============================
    // ✅ HELPERS
    // ==============================
    function getCookie(req, name) {
      const cookie = req.headers.get("Cookie") || "";
      const parts = cookie.split(";").map((v) => v.trim());
      for (const part of parts) {
        if (part.startsWith(name + "=")) {
          return decodeURIComponent(part.slice(name.length + 1));
        }
      }
      return null;
    }

    function buildSetCookie({ value, maxAge = DEFAULT_MAX_AGE }) {
      return [
        `${COOKIE_NAME}=${encodeURIComponent(value)}`,
        "Path=/",
        `Domain=${COOKIE_DOMAIN}`, // ✅ share across subdomains
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        `Max-Age=${maxAge}`,
      ].join("; ");
    }

    function buildClearCookie() {
      return [
        `${COOKIE_NAME}=`,
        "Path=/",
        `Domain=${COOKIE_DOMAIN}`,
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Max-Age=0",
      ].join("; ");
    }

    // Prefer cookie, but temporarily allow Authorization header for migration
    function getTokenFromRequest(req) {
      const cookieToken = getCookie(req, COOKIE_NAME);
      if (cookieToken) return cookieToken;

      const auth = req.headers.get("Authorization");
      if (auth?.startsWith("Bearer ")) return auth.slice(7);

      return null;
    }

    function decodeAndValidateToken(token) {
      let payload;
      try {
        payload = parseJwtPayload(token);
      } catch {
        return { ok: false, error: "invalid_token", payload: null };
      }

      // optional exp check
      if (payload?.exp && payload.exp * 1000 < Date.now()) {
        return { ok: false, error: "expired", payload: null };
      }

      const email = extractEmail(payload);
      if (!email) return { ok: false, error: "missing_email", payload: null };

      return { ok: true, payload, email };
    }

    // ==============================
    // ✅ API: POST /api/logout (clear cookie)
    // ==============================
    if (url.pathname === "/api/logout" && request.method === "POST") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": buildClearCookie(),
          ...corsHeaders,
        },
      });
    }

    // ==============================
    // ✅ API: GET /api/me (check login quick)
    // ==============================
    if (url.pathname === "/api/me" && request.method === "GET") {
      const token = getTokenFromRequest(request);
      if (!token) {
        return new Response(JSON.stringify({ loggedIn: false, user: null }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const decoded = decodeAndValidateToken(token);
      if (!decoded.ok) {
        return new Response(JSON.stringify({ loggedIn: false, user: null }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            // optional: clear cookie if expired/invalid
            ...(decoded.error === "expired" || decoded.error === "invalid_token"
              ? { "Set-Cookie": buildClearCookie() }
              : {}),
            ...corsHeaders,
          },
        });
      }

      // You can return minimal identity info
      return new Response(
        JSON.stringify({
          loggedIn: true,
          user: { email: decoded.email, aud: decoded.payload?.aud || null },
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    /* ==============================
       SSO: Get app launch link (proxy to Odoo)
       POST /api/v1/sso/app_link
    ================================= */
    if (url.pathname === "/api/v1/sso/app_link") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
      }

      try {

        const bodyText = await request.text(); // keep raw JSON
        const upstreamUrl = "https://mrbur-sandbox.odoo.com/api/v1/sso/app_link";

        const upstreamRes = await fetch(upstreamUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-SSO-API-KEY": env.ODOO_SSO_API_KEY, // forward to Odoo
          },
          body: bodyText,
        });

        const upstreamText = await upstreamRes.text();

        // pass-through response (recommended)
        return new Response(upstreamText, {
          status: upstreamRes.status,
          headers: {
            "Content-Type": upstreamRes.headers.get("Content-Type") || "application/json",
            ...corsHeaders,
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err?.message || "SSO app_link failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    /* ==============================
   authenticate web session
================================= */
    if (url.pathname === "/api/web/session/authenticate") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
      }

      try {
        const body = await request.json();

        const login = body?.params?.login;
        const password = body?.params?.password;

        if (!login || !password) {
          return new Response(JSON.stringify({ ok: false, error: "Missing email or password" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        const ODOO_BASE = "https://mrbur-sandbox.odoo.com";
        const DB = "mrbur-staging-bur-26090883";

        const upstream = await fetch(`${ODOO_BASE}/web/session/authenticate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "call",
            params: {
              db: DB,
              login,
              password,
            },
            id: body?.id ?? 1,
          }),
        });

        const data = await upstream.json().catch(() => null);

        if (!upstream.ok) {
          return new Response(
            JSON.stringify({ ok: false, error: "Upstream Odoo error", status: upstream.status, data }),
            { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (data?.error) {
          return new Response(
            JSON.stringify({ ok: false, error: data.error.message || "Odoo login failed", data }),
            { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // ✅ Odoo success payload is in data.result
        const result = data?.result;

        // ✅ Forward Odoo session cookies (important for session auth)
        const setCookie = upstream.headers.get("Set-Cookie");

        // ✅ This is the key change: return sessionInfo so frontend can do result.sessionInfo.name
        return new Response(
          JSON.stringify({
            ok: true,

            // 👇 what your frontend expects
            sessionInfo: {
              name: result?.name ?? result?.partner_display_name ?? "",
              email: result?.username ?? login,
              uid: result?.uid ?? null,
              partner_id: result?.partner_id ?? null,
              db: result?.db ?? DB,
            },

            // 👇 keep raw Odoo payload too (optional but useful for debugging)
            data,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...(setCookie ? { "Set-Cookie": setCookie } : {}),
              ...corsHeaders,
            },
          }
        );
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err?.message || "Odoo login failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }


    /* ==============================
      Create user in Odoo
    =================================*/
    // ✅ API: POST /api/v1/users -> forward to Odoo sandbox
    if (url.pathname === "/api/v1/users") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
      }

      const upstreamUrl = "https://mrbur-sandbox.odoo.com/api/v1/users";

      const upstreamRes = await fetch(upstreamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SSO-API-KEY": env.ODOO_SSO_API_KEY,
        },
        body: await request.text(),
      });

      return new Response(await upstreamRes.text(), {
        status: upstreamRes.status,
        headers: {
          "Content-Type": upstreamRes.headers.get("Content-Type") || "application/json",
          ...corsHeaders,
        },
      });
    }

    // /* ==============================
    //    API: /api/appointments
    //    ============================== */
    // if (url.pathname === "/api/appointments") {
    //   const auth = request.headers.get("Authorization");
    //   if (!auth?.startsWith("Bearer ")) {
    //     return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    //   }
    //   // Security: Validate Token
    //   const token = auth.slice(7);
    //   let payload;
    //   try {
    //     payload = parseJwtPayload(token);
    //     if (payload?.exp && payload.exp * 1000 < Date.now()) throw new Error("expired");
    //   } catch {
    //     return new Response("Invalid Token", { status: 401, headers: corsHeaders });
    //   }
    //   try {
    //     // GET (List)
    //     if (request.method === "GET") {
    //       const clinicId = url.searchParams.get("clinicId");
    //       if (!clinicId) throw new Error("Missing clinicId");

    //       const data = await getAppointments(env, clinicId);
    //       return new Response(JSON.stringify(data), {
    //         headers: { "Content-Type": "application/json", ...corsHeaders },
    //       });
    //     }
    //     // POST (Create)
    //     if (request.method === "POST") {
    //       const body = await request.json();
    //       const data = await createAppointment(env, body);
    //       return new Response(JSON.stringify(data), {
    //         headers: { "Content-Type": "application/json", ...corsHeaders },
    //       });
    //     }
    //     // PATCH (Update)
    //     if (request.method === "PATCH") {
    //       const id = url.searchParams.get("id");
    //       if (!id) throw new Error("Missing ID for update");
    //       const body = await request.json();
    //       const data = await updateAppointment(env, id, body);
    //       return new Response(JSON.stringify(data), {
    //         headers: { "Content-Type": "application/json", ...corsHeaders },
    //       });
    //     }
    //     // DELETE
    //     if (request.method === "DELETE") {
    //       const id = url.searchParams.get("id");
    //       if (!id) throw new Error("Missing ID for delete");
    //       await deleteAppointment(env, id);
    //       return new Response(JSON.stringify({ ok: true }), {
    //         headers: { "Content-Type": "application/json", ...corsHeaders },
    //       });
    //     }
    //   } catch (e) {
    //     return new Response(JSON.stringify({ error: e.message }), {
    //       status: 500,
    //       headers: { "Content-Type": "application/json", ...corsHeaders },
    //     });
    //   }
    // }

    // /* ==============================
    //    API: /api/patients
    //    ============================== */
    // if (url.pathname === "/api/patients") {
    //   const auth = request.headers.get("Authorization");
    //   if (!auth?.startsWith("Bearer ")) {
    //     return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    //   }
    //   // Security Check
    //   const token = auth.slice(7);
    //   try {
    //     const payload = parseJwtPayload(token);
    //     if (payload?.exp && payload.exp * 1000 < Date.now()) throw new Error("expired");
    //   } catch {
    //     return new Response("Invalid Token", { status: 401, headers: corsHeaders });
    //   }
    //   const clinicId = url.searchParams.get("clinicId");

    //   try {
    //     // GET (List or Search)
    //     if (request.method === "GET") {
    //       if (!clinicId) throw new Error("Missing clinicId");
    //       const query = url.searchParams.get("query");

    //       let data;
    //       if (query) {
    //         data = await searchPatients(env, clinicId, query);
    //       } else {
    //         const limit = parseInt(url.searchParams.get("limit") ?? "50");
    //         const offset = parseInt(url.searchParams.get("offset") ?? "0");
    //         data = await getPatients(env, clinicId, limit, offset);
    //       }
    //       return new Response(JSON.stringify(data), {
    //         headers: { "Content-Type": "application/json", ...corsHeaders },
    //       });
    //     }
    //     // POST (Create)
    //     if (request.method === "POST") {
    //       const body = await request.json();
    //       const data = await createPatient(env, body);
    //       return new Response(JSON.stringify(data), {
    //         headers: { "Content-Type": "application/json", ...corsHeaders },
    //       });
    //     }
    //     // PATCH (Update)
    //     if (request.method === "PATCH") {
    //       const id = url.searchParams.get("id");
    //       if (!id) throw new Error("Missing ID");
    //       const body = await request.json();
    //       const data = await updatePatient(env, id, body);
    //       return new Response(JSON.stringify(data), {
    //         headers: { "Content-Type": "application/json", ...corsHeaders },
    //       });
    //     }
    //     // DELETE
    //     if (request.method === "DELETE") {
    //       const id = url.searchParams.get("id");
    //       if (!id) throw new Error("Missing ID");
    //       await deletePatient(env, id);
    //       return new Response(JSON.stringify({ ok: true }), {
    //         headers: { "Content-Type": "application/json", ...corsHeaders },
    //       });
    //     }
    //   } catch (e) {
    //     return new Response(JSON.stringify({ error: e.message }), {
    //       status: 500,
    //       headers: { "Content-Type": "application/json", ...corsHeaders },
    //     });
    //   }
    // }

    // /* ==============================
    //    API: /api/staff
    //    ============================== */
    // if (url.pathname === "/api/staff") {
    //   const auth = request.headers.get("Authorization");
    //   if (!auth?.startsWith("Bearer ")) {
    //     return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    //   }
    //   const token = auth.slice(7);
    //   try {
    //     const payload = parseJwtPayload(token);
    //     if (payload?.exp && payload.exp * 1000 < Date.now()) throw new Error("expired");
    //   } catch {
    //     return new Response("Invalid Token", { status: 401, headers: corsHeaders });
    //   }
    //   const clinicId = url.searchParams.get("clinicId");
    //   try {
    //     // GET (List)
    //     if (request.method === "GET") {
    //       if (!clinicId) throw new Error("Missing clinicId");
    //       const data = await getStaff(env, clinicId);
    //       return new Response(JSON.stringify(data), {
    //         headers: { "Content-Type": "application/json", ...corsHeaders },
    //       });
    //     }
    //     // POST (Create)
    //     if (request.method === "POST") {
    //       const body = await request.json();
    //       const data = await createStaff(env, body);
    //       return new Response(JSON.stringify(data), {
    //         headers: { "Content-Type": "application/json", ...corsHeaders },
    //       });
    //     }
    //     // PATCH (Update)
    //     if (request.method === "PATCH") {
    //       const id = url.searchParams.get("id");
    //       if (!id) throw new Error("Missing ID");
    //       const body = await request.json();
    //       const data = await updateStaff(env, id, body);
    //       return new Response(JSON.stringify(data), {
    //         headers: { "Content-Type": "application/json", ...corsHeaders },
    //       });
    //     }
    //     // DELETE
    //     if (request.method === "DELETE") {
    //       const id = url.searchParams.get("id");
    //       if (!id) throw new Error("Missing ID");
    //       await deleteStaff(env, id);
    //       return new Response(JSON.stringify({ ok: true }), {
    //         headers: { "Content-Type": "application/json", ...corsHeaders },
    //       });
    //     }
    //   } catch (e) {
    //     return new Response(JSON.stringify({ error: e.message }), {
    //       status: 500,
    //       headers: { "Content-Type": "application/json", ...corsHeaders },
    //     });
    //   }
    // }

    // /* ==============================
    //    API: /api/rooms
    //    ============================== */
    // if (url.pathname === "/api/rooms") {
    //   const auth = request.headers.get("Authorization");
    //   if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    //   const token = auth.slice(7);
    //   try {
    //     const p = parseJwtPayload(token);
    //     if (p?.exp && p.exp * 1000 < Date.now()) throw new Error("expired");
    //   } catch {
    //     return new Response("Invalid Token", { status: 401, headers: corsHeaders });
    //   }
    //   const clinicId = url.searchParams.get("clinicId");
    //   try {
    //     if (request.method === "GET") {
    //       const data = await getRooms(env, clinicId);
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //     if (request.method === "POST") {
    //       const data = await createRoom(env, await request.json());
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //     if (request.method === "PATCH") {
    //       const id = url.searchParams.get("id");
    //       const data = await updateRoom(env, id, await request.json());
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //     if (request.method === "DELETE") {
    //       const id = url.searchParams.get("id");
    //       await deleteRoom(env, id);
    //       return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //   } catch (e) {
    //     return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    //   }
    // }

    // /* ==============================
    //     API: /api/treatments
    //     ============================== */
    // if (url.pathname === "/api/treatments") {
    //   const auth = request.headers.get("Authorization");
    //   if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    //   const token = auth.slice(7);
    //   try {
    //     const p = parseJwtPayload(token);
    //     if (p?.exp && p.exp * 1000 < Date.now()) throw new Error("expired");
    //   } catch {
    //     return new Response("Invalid Token", { status: 401, headers: corsHeaders });
    //   }

    //   const clinicId = url.searchParams.get("clinicId");

    //   try {
    //     if (request.method === "GET") {
    //       const data = await getTreatments(env, clinicId);
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //     if (request.method === "POST") {
    //       const data = await createTreatment(env, await request.json());
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //     if (request.method === "PATCH") {
    //       const id = url.searchParams.get("id");
    //       const data = await updateTreatment(env, id, await request.json());
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //     if (request.method === "DELETE") {
    //       const id = url.searchParams.get("id");
    //       await deleteTreatment(env, id);
    //       return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //   } catch (e) {
    //     return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    //   }
    // }

    // /* ==============================
    //    API: /api/settings
    //    ============================== */
    // if (url.pathname === "/api/settings") {
    //   const auth = request.headers.get("Authorization");
    //   if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    //   const token = auth.slice(7);
    //   try {
    //     const p = parseJwtPayload(token);
    //     if (p?.exp && p.exp * 1000 < Date.now()) throw new Error("expired");
    //   } catch { return new Response("Invalid Token", { status: 401, headers: corsHeaders }); }
    //   const clinicId = url.searchParams.get("clinicId");
    //   try {
    //     if (request.method === "GET") {
    //       const data = await getSettings(env, clinicId);
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //     if (request.method === "POST") { // Save/Upsert
    //       const data = await saveSettings(env, await request.json());
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //   } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }); }
    // }
    // /* ==============================
    //    API: /api/holidays
    //    ============================== */
    // if (url.pathname === "/api/holidays") {
    //   const auth = request.headers.get("Authorization");
    //   if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    //   const token = auth.slice(7);
    //   try {
    //     const p = parseJwtPayload(token);
    //     if (p?.exp && p.exp * 1000 < Date.now()) throw new Error("expired");
    //   } catch { return new Response("Invalid Token", { status: 401, headers: corsHeaders }); }
    //   const clinicId = url.searchParams.get("clinicId");
    //   try {
    //     if (request.method === "GET") {
    //       const data = await getHolidays(env, clinicId);
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //     if (request.method === "POST") {
    //       const data = await addHoliday(env, await request.json());
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //     if (request.method === "PATCH") {
    //       const id = url.searchParams.get("id");
    //       const data = await updateHoliday(env, id, await request.json());
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //     if (request.method === "DELETE") {
    //       const id = url.searchParams.get("id");
    //       await deleteHoliday(env, id);
    //       return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //   } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }); }
    // }
    // /* ==============================
    //    API: /api/activity
    //    ============================== */
    // if (url.pathname === "/api/activity") {
    //   const auth = request.headers.get("Authorization");
    //   if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    //   const token = auth.slice(7);
    //   try {
    //     const p = parseJwtPayload(token);
    //     if (p?.exp && p.exp * 1000 < Date.now()) throw new Error("expired");
    //   } catch { return new Response("Invalid Token", { status: 401, headers: corsHeaders }); }
    //   const clinicId = url.searchParams.get("clinicId");
    //   try {
    //     if (request.method === "GET") {
    //       // For admin, clinicId might be missing or special flag. The helper handles it.
    //       const data = await getActivity(env, clinicId);
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //     if (request.method === "POST") {
    //       const data = await addActivity(env, await request.json());
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //   } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }); }
    // }

    // /* ==============================
    //    API: /api/requests
    //    ============================== */
    // if (url.pathname === "/api/requests") {
    //   const auth = request.headers.get("Authorization");
    //   if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    //   const token = auth.slice(7);
    //   try {
    //     const p = parseJwtPayload(token);
    //     if (p?.exp && p.exp * 1000 < Date.now()) throw new Error("expired");
    //   } catch { return new Response("Invalid Token", { status: 401, headers: corsHeaders }); }
    //   const clinicId = url.searchParams.get("clinicId");
    //   try {
    //     if (request.method === "GET") {
    //       const data = await getRequests(env, clinicId);
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //     if (request.method === "PATCH") {
    //       const id = url.searchParams.get("id");
    //       if (!id) throw new Error("Missing ID");
    //       const data = await updateRequest(env, id, await request.json());
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //   } catch (e) {
    //     return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    //   }
    // }

    // /* ==============================
    //  API: /api/clinics
    //  ============================== */
    // if (url.pathname === "/api/clinics") {
    //   const auth = request.headers.get("Authorization");
    //   if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    //   const token = auth.slice(7);
    //   try {
    //     const p = parseJwtPayload(token);
    //     if (p?.exp && p.exp * 1000 < Date.now()) throw new Error("expired");
    //   } catch { return new Response("Invalid Token", { status: 401, headers: corsHeaders }); }

    //   try {
    //     if (request.method === "GET") {
    //       const id = url.searchParams.get("id");
    //       if (id) {
    //         const data = await getClinicById(env, id);
    //         return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //       }
    //       const data = await getClinics(env);
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //     if (request.method === "POST") {
    //       const data = await addClinic(env, await request.json());
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //     if (request.method === "PATCH") {
    //       const id = url.searchParams.get("id");
    //       const data = await updateClinic(env, id, await request.json());
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //     if (request.method === "DELETE") {
    //       const id = url.searchParams.get("id");
    //       await deleteClinic(env, id);
    //       return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //   } catch (e) {
    //     return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    //   }
    // }

    // /* ==============================
    //  API: /api/apt_profiles
    //  ============================== */
    // if (url.pathname === "/api/profiles") {
    //   const auth = request.headers.get("Authorization");
    //   if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    //   const token = auth.slice(7);
    //   try {
    //     const p = parseJwtPayload(token);
    //     if (p?.exp && p.exp * 1000 < Date.now()) throw new Error("expired");
    //   } catch { return new Response("Invalid Token", { status: 401, headers: corsHeaders }); }

    //   try {
    //     if (request.method === "GET") {
    //       const id = url.searchParams.get("id");
    //       const email = url.searchParams.get("email");

    //       if (id) {
    //         const data = await getProfileById(env, id);
    //         return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //       }
    //       if (email) {
    //         const data = await getProfileByEmail(env, email);
    //         return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //       }

    //       // Default: List all
    //       const data = await getProfiles(env);
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }

    //     if (request.method === "PATCH") {
    //       const id = url.searchParams.get("id");
    //       if (!id) throw new Error("Missing ID");
    //       const data = await updateProfile(env, id, await request.json());
    //       return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    //     }
    //   } catch (e) {
    //     return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    //   }
    // }


    // /* ==============================
    //    API: POST /api/inventory/sync
    //    ============================== */
    // if (url.pathname === "/api/inventory/sync" && request.method === "POST") {
    //   // ✅ Cookie-based auth
    //   const token = getTokenFromRequest(request);
    //   if (!token) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    //   const decoded = decodeAndValidateToken(token);
    //   if (!decoded.ok) {
    //     return new Response("Unauthorized", {
    //       status: 401,
    //       headers: {
    //         ...(decoded.error === "expired" ? { "Set-Cookie": buildClearCookie() } : {}),
    //         ...corsHeaders,
    //       },
    //     });
    //   }

    //   const body = await request.json();
    //   await inventoryFullSync(env, body);

    //   return new Response(JSON.stringify({ ok: true }), {
    //     headers: { "Content-Type": "application/json", ...corsHeaders },
    //   });
    // }

    /* ==============================
       API: GET /api/bootstrap
       ============================== */
    if (url.pathname === "/api/bootstrap") {
      // ✅ Cookie-based auth
      const token = getTokenFromRequest(request);
      if (!token) {
        return new Response(JSON.stringify({ loggedIn: false }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const decoded = decodeAndValidateToken(token);
      if (!decoded.ok) {
        return new Response(JSON.stringify({ loggedIn: false, error: decoded.error }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...(decoded.error === "expired" ? { "Set-Cookie": buildClearCookie() } : {}),
            ...corsHeaders,
          },
        });
      }

      try {
        const result = await supabaseBootstrapByEmail(env, decoded.email);

        return new Response(
          JSON.stringify({
            loggedIn: true,
            user: result,
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } catch (e) {
        return new Response(JSON.stringify({ loggedIn: false, error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    /* ==============================
      API: GET /api/verify-token
      (kept same shape, but reads cookie)
    ============================== */
    if (url.pathname === "/api/verify-token") {
      const token = getTokenFromRequest(request);
      if (!token) {
        return new Response(JSON.stringify({ loggedIn: false }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const decoded = decodeAndValidateToken(token);
      if (!decoded.ok) {
        return new Response(JSON.stringify({ loggedIn: false }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...(decoded.error === "expired" ? { "Set-Cookie": buildClearCookie() } : {}),
            ...corsHeaders,
          },
        });
      }

      // fetch profile
      let profile;
      try {
        profile = await getProfileByEmail(env, decoded.email);
      } catch (e) {
        return new Response(JSON.stringify({ loggedIn: false, error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (!profile) {
        return new Response(JSON.stringify({ loggedIn: false }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // fetch meta
      let meta = [];
      try {
        meta = await getInventoryMetaByUserId(env, profile.user_id);
      } catch {
        meta = [];
      }

      return new Response(
        JSON.stringify({
          loggedIn: true,
          user: {
            profiles: {
              user: {
                user_id: profile.user_id,
                email: profile.email,
                user_metadata: {
                  name: profile.name,
                  account_type: profile.account_type,
                  phone: profile.phone,
                  position: profile.position,
                  company_name: profile.company_name,
                },
              },
            },
            meta,
            rooms: [],
            rooms_error: null,
            items_data: [],
            history_data: [],
            log_data: [],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // /* ==============================
    //    API: GET /api/inventory/meta
    //    ============================== */
    // if (url.pathname === "/api/inventory/meta") {
    //   const token = getTokenFromRequest(request);
    //   if (!token) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    //   const decoded = decodeAndValidateToken(token);
    //   if (!decoded.ok) {
    //     return new Response("Unauthorized", {
    //       status: 401,
    //       headers: {
    //         ...(decoded.error === "expired" ? { "Set-Cookie": buildClearCookie() } : {}),
    //         ...corsHeaders,
    //       },
    //     });
    //   }

    //   let profile;
    //   try {
    //     profile = await getProfileByEmail(env, decoded.email);
    //   } catch (e) {
    //     return new Response(e.message, { status: 500, headers: corsHeaders });
    //   }

    //   if (!profile) {
    //     return new Response("User not found", { status: 403, headers: corsHeaders });
    //   }

    //   try {
    //     const meta = await getInventoryMetaByUserId(env, profile.user_id);
    //     return new Response(JSON.stringify({ profile, meta }), {
    //       headers: { "Content-Type": "application/json", ...corsHeaders },
    //     });
    //   } catch (e) {
    //     return new Response(e.message, { status: 500, headers: corsHeaders });
    //   }
    // }

    /* ==============================
       ✅ SSO LOGIN (UPDATED: SET COOKIE + REDIRECT)
       ============================== */
    if (url.pathname === "/sso/login") {
      const token = url.searchParams.get("token");
      if (!token) return new Response("Missing token", { status: 400 });

      const decoded = decodeAndValidateToken(token);
      if (!decoded.ok) {
        return new Response("Invalid Token", { status: 400 });
      }

      // Use aud to route app (same as your current)
      const appCode = decoded.payload.aud;
      const config = APP_CONFIG[appCode];
      if (!config) {
        return new Response(`Unknown App Code: ${appCode}`, { status: 400 });
      }

      // ✅ set cookie shared across subdomains
      // If you want max-age to follow token exp exactly:
      // const now = Math.floor(Date.now() / 1000);
      // const maxAge = decoded.payload?.exp ? Math.max(0, decoded.payload.exp - now) : DEFAULT_MAX_AGE;
      const maxAge = DEFAULT_MAX_AGE;

      // OPTIONAL: ensure user exists (your existing check)
      if (config.type === "supabase") {
        try {
          const profile = await getProfileByEmail(env, decoded.email);
          console.log("[SSO] profile:", profile);
        } catch (e) {
          return new Response(e.message, { status: 500 });
        }

        const finalUrl = `${config.baseUrl}/login`;

        return new Response(null, {
          status: 302,
          headers: {
            "Set-Cookie": buildSetCookie({ value: token, maxAge }),
            Location: finalUrl,
            "Cache-Control": "no-store",
          },
        });
      } else if (config.type === "odoo") {
        try {
          const profile = await getProfileByEmail(env, decoded.email);
          console.log("[SSO] profile:", profile);
        } catch (e) {
          return new Response(e.message, { status: 500 });
        }

        const finalUrl = `${config.baseUrl}`;

        return new Response(null, {
          status: 302,
          headers: {
            "Set-Cookie": buildSetCookie({ value: token, maxAge }),
            Location: finalUrl,
            "Cache-Control": "no-store",
          },
        });
      }

      // For OAuth apps (kept, but also set cookie if you want)
      const MAIN_ODOO_URL = "https://mrbur-staging-bur-2609087.dev.odoo.com";
      const redirectUri = `${config.baseUrl}/auth_oauth/signin`;

      const oauthUrl =
        `${MAIN_ODOO_URL}/oauth2/auth` +
        `?client_id=${config.clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token&scope=userinfo`;

      return new Response(null, {
        status: 302,
        headers: {
          "Set-Cookie": buildSetCookie({ value: token, maxAge }),
          Location: oauthUrl,
          "Cache-Control": "no-store",
        },
      });
    }

    // /* ==============================
    //   Whiteboard API (notes/drawings/shares)
    // =================================*/
    // const whiteboardResponse = await handleWhiteboardApi({
    //   request,
    //   env,
    //   corsHeaders,
    //   getTokenFromRequest,
    //   decodeAndValidateToken,
    //   getProfileByEmail,
    // });
    // if (whiteboardResponse) return whiteboardResponse;

    // /* ==============================
    //   Tasks API
    // =================================*/
    // const tasksResponse = await handleTasksApi({
    //   request,
    //   env,
    //   corsHeaders,
    //   getTokenFromRequest,
    //   decodeAndValidateToken,
    //   getProfileByEmail,
    // });
    // if (tasksResponse) return tasksResponse;

    /* ==============================
      Hiring API
    =================================*/
    const hiringResponse = await handleHiringApi({
      request,
      env,
      corsHeaders,
      getTokenFromRequest,
      decodeAndValidateToken,
      getProfileByEmail,
    });
    if (hiringResponse) return hiringResponse;

    return new Response("SSO Gateway Active", {
      status: 200,
      headers: corsHeaders,
    });
  },
};