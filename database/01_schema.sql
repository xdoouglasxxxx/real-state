-- =====================================================================
-- MAISON SAAS — Banco de dados Postgres (Supabase)
-- Compatível com prisma/schema.prisma (mesmos nomes de tabelas/colunas
-- que o Prisma geraria; depois de rodar, `prisma db pull` sincroniza).
-- Rodar no SQL Editor do Supabase: 01_schema.sql -> 02_seed.sql -> 03_rls.sql
-- =====================================================================

-- ---------- ENUMS ----------
CREATE TYPE "Plan"             AS ENUM ('STARTER','PRO','ENTERPRISE');
CREATE TYPE "SubStatus"        AS ENUM ('TRIALING','ACTIVE','PAST_DUE','CANCELED');
CREATE TYPE "Role"             AS ENUM ('PLATFORM_ADMIN','ORG_ADMIN','MANAGER','AGENT','CLIENT','OWNER');
CREATE TYPE "ContactKind"      AS ENUM ('BUYER','OWNER','BOTH');
CREATE TYPE "PropertyType"     AS ENUM ('HOUSE','APARTMENT','LAND','COMMERCIAL','FARM');
CREATE TYPE "PropStatus"       AS ENUM ('DRAFT','FOR_SALE','EXCLUSIVE','RESERVED','SOLD','ARCHIVED');
CREATE TYPE "MediaKind"        AS ENUM ('PHOTO','VIDEO','DRONE','VIRTUAL_TOUR','FLOORPLAN');
CREATE TYPE "DocKind"          AS ENUM ('ESCRITURA','MATRICULA','IPTU','CONTRATO','PROCURACAO','LAUDO','OUTRO');
CREATE TYPE "LeadSource"       AS ENUM ('SITE','INSTAGRAM','FACEBOOK','WHATSAPP','GOOGLE','INDICACAO','PORTAL','OUTRO');
CREATE TYPE "LeadStage"        AS ENUM ('NEW','CONTACTED','VISIT','PROPOSAL','FINANCING','CONTRACT','WON','LOST');
CREATE TYPE "ActivityType"     AS ENUM ('PAGE_VIEW','FORM_SUBMIT','WHATSAPP_SENT','WHATSAPP_RECEIVED','EMAIL_SENT','CALL','NOTE','STAGE_CHANGE');
CREATE TYPE "VisitStatus"      AS ENUM ('SCHEDULED','DONE','NO_SHOW','CANCELED');
CREATE TYPE "ProposalStatus"   AS ENUM ('SENT','COUNTER','ACCEPTED','REJECTED','EXPIRED');
CREATE TYPE "ContractStatus"   AS ENUM ('AWAITING_SIGNATURE','SIGNED','FINANCING','CLOSED','CANCELED');
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING','PAID','CANCELED');
CREATE TYPE "FlowDir"          AS ENUM ('IN','OUT');
CREATE TYPE "FinCategory"      AS ENUM ('COMISSAO_RECEBIDA','COMISSAO_PAGA','IMPOSTO','PRO_LABORE','DESPESA_FIXA','DESPESA_VARIAVEL','MARKETING','RECEITA_OUTRA');

-- ---------- TENANT ----------
CREATE TABLE "Organization" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name"       TEXT NOT NULL,
  "slug"       TEXT NOT NULL UNIQUE,
  "logoUrl"    TEXT,
  "themeInk"   TEXT NOT NULL DEFAULT '#17130e',
  "themeBrass" TEXT NOT NULL DEFAULT '#c6a15b',
  "themeCream" TEXT NOT NULL DEFAULT '#f4efe4',
  "creci"      TEXT,
  "phone"      TEXT,
  "email"      TEXT,
  "address"    TEXT,
  "city"       TEXT,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Domain" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "host"           TEXT NOT NULL UNIQUE,
  "isPrimary"      BOOLEAN NOT NULL DEFAULT false,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX "Domain_organizationId_idx" ON "Domain"("organizationId");

CREATE TABLE "Subscription" (
  "id"                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId"       TEXT NOT NULL UNIQUE REFERENCES "Organization"("id") ON DELETE CASCADE,
  "plan"                 "Plan" NOT NULL DEFAULT 'STARTER',
  "status"               "SubStatus" NOT NULL DEFAULT 'TRIALING',
  "stripeCustomerId"     TEXT UNIQUE,
  "stripeSubscriptionId" TEXT UNIQUE,
  "currentPeriodEnd"     TIMESTAMPTZ,
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- PESSOAS ----------
CREATE TABLE "User" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email"          TEXT NOT NULL,
  "name"           TEXT,
  "role"           "Role" NOT NULL DEFAULT 'AGENT',
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("organizationId","email")
);
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

CREATE TABLE "Agent" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "userId"         TEXT UNIQUE REFERENCES "User"("id"),
  "name"           TEXT NOT NULL,
  "creci"          TEXT,
  "phone"          TEXT,
  "email"          TEXT,
  "photoUrl"       TEXT,
  "bio"            TEXT,
  "commissionPct"  DECIMAL(5,2) NOT NULL DEFAULT 2.5,
  "isFeatured"     BOOLEAN NOT NULL DEFAULT false,
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Agent_organizationId_idx" ON "Agent"("organizationId");

CREATE TABLE "Contact" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "kind"           "ContactKind" NOT NULL DEFAULT 'BUYER',
  "name"           TEXT NOT NULL,
  "phone"          TEXT,
  "email"          TEXT,
  "document"       TEXT, -- CPF/CNPJ: LGPD — colete só quando necessário
  "notes"          TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Contact_organizationId_idx" ON "Contact"("organizationId");
CREATE INDEX "Contact_org_phone_idx" ON "Contact"("organizationId","phone");

-- ---------- IMÓVEIS ----------
CREATE TABLE "Property" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "slug"           TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "description"    TEXT,
  "type"           "PropertyType" NOT NULL,
  "status"         "PropStatus" NOT NULL DEFAULT 'FOR_SALE',
  "price"          DECIMAL(14,2) NOT NULL,
  "condoFee"       DECIMAL(12,2),
  "iptuYearly"     DECIMAL(12,2),
  "neighborhood"   TEXT,
  "city"           TEXT,
  "state"          TEXT DEFAULT 'SP',
  "zipcode"        TEXT,
  "address"        TEXT,
  "latitude"       DOUBLE PRECISION,
  "longitude"      DOUBLE PRECISION,
  "bedrooms"       INTEGER,
  "bathrooms"      INTEGER,
  "suites"         INTEGER,
  "parkingSpaces"  INTEGER,
  "areaM2"         INTEGER,
  "features"       TEXT[] NOT NULL DEFAULT '{}',
  "ownerId"        TEXT REFERENCES "Contact"("id"),
  "agentId"        TEXT REFERENCES "Agent"("id"),
  "commissionPct"  DECIMAL(5,2),
  "isFeatured"     BOOLEAN NOT NULL DEFAULT false,
  "publishedAt"    TIMESTAMPTZ,
  "seoTitle"       TEXT,
  "seoDescription" TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("organizationId","slug")
);
CREATE INDEX "Property_org_status_idx"   ON "Property"("organizationId","status");
CREATE INDEX "Property_org_location_idx" ON "Property"("organizationId","city","neighborhood");
CREATE INDEX "Property_org_price_idx"    ON "Property"("organizationId","price");

CREATE TABLE "PropertyMedia" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "propertyId" TEXT NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
  "kind"       "MediaKind" NOT NULL DEFAULT 'PHOTO',
  "url"        TEXT NOT NULL,
  "caption"    TEXT,
  "sortOrder"  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX "PropertyMedia_prop_order_idx" ON "PropertyMedia"("propertyId","sortOrder");

CREATE TABLE "Contract" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "proposalId"     TEXT NOT NULL UNIQUE,
  "status"         "ContractStatus" NOT NULL DEFAULT 'AWAITING_SIGNATURE',
  "totalAmount"    DECIMAL(14,2) NOT NULL,
  "signedAt"       TIMESTAMPTZ,
  "closedAt"       TIMESTAMPTZ,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Contract_org_status_idx" ON "Contract"("organizationId","status");

CREATE TABLE "Document" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "propertyId" TEXT REFERENCES "Property"("id") ON DELETE CASCADE,
  "contractId" TEXT REFERENCES "Contract"("id") ON DELETE CASCADE,
  "kind"       "DocKind" NOT NULL,
  "name"       TEXT NOT NULL,
  "fileUrl"    TEXT NOT NULL, -- storage PRIVADO + URL assinada
  "uploadedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Document_propertyId_idx" ON "Document"("propertyId");
CREATE INDEX "Document_contractId_idx" ON "Document"("contractId");

CREATE TABLE "PropertyEvent" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "propertyId" TEXT NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
  "type"       TEXT NOT NULL,
  "payload"    JSONB,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "PropertyEvent_prop_date_idx" ON "PropertyEvent"("propertyId","createdAt");

CREATE TABLE "Favorite" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "contactId"  TEXT NOT NULL REFERENCES "Contact"("id") ON DELETE CASCADE,
  "propertyId" TEXT NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("contactId","propertyId")
);

-- ---------- CRM ----------
CREATE TABLE "Lead" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "contactId"      TEXT NOT NULL REFERENCES "Contact"("id"),
  "propertyId"     TEXT REFERENCES "Property"("id"),
  "agentId"        TEXT REFERENCES "Agent"("id"),
  "source"         "LeadSource" NOT NULL DEFAULT 'SITE',
  "stage"          "LeadStage" NOT NULL DEFAULT 'NEW',
  "score"          INTEGER NOT NULL DEFAULT 0,
  "budgetMax"      DECIMAL(14,2),
  "interest"       TEXT,
  "lostReason"     TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Lead_org_stage_idx"       ON "Lead"("organizationId","stage");
CREATE INDEX "Lead_org_agent_stage_idx" ON "Lead"("organizationId","agentId","stage");
CREATE INDEX "Lead_org_created_idx"     ON "Lead"("organizationId","createdAt");

CREATE TABLE "Activity" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "leadId"    TEXT NOT NULL REFERENCES "Lead"("id") ON DELETE CASCADE,
  "type"      "ActivityType" NOT NULL,
  "payload"   JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Activity_lead_date_idx" ON "Activity"("leadId","createdAt");

CREATE TABLE "Visit" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "propertyId"     TEXT NOT NULL REFERENCES "Property"("id"),
  "leadId"         TEXT REFERENCES "Lead"("id"),
  "contactId"      TEXT REFERENCES "Contact"("id"),
  "agentId"        TEXT REFERENCES "Agent"("id"),
  "scheduledAt"    TIMESTAMPTZ NOT NULL,
  "status"         "VisitStatus" NOT NULL DEFAULT 'SCHEDULED',
  "feedback"       TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Visit_org_date_idx"       ON "Visit"("organizationId","scheduledAt");
CREATE INDEX "Visit_org_agent_date_idx" ON "Visit"("organizationId","agentId","scheduledAt");

CREATE TABLE "Proposal" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "propertyId"     TEXT NOT NULL REFERENCES "Property"("id"),
  "leadId"         TEXT REFERENCES "Lead"("id"),
  "contactId"      TEXT NOT NULL REFERENCES "Contact"("id"),
  "amount"         DECIMAL(14,2) NOT NULL,
  "conditions"     TEXT,
  "status"         "ProposalStatus" NOT NULL DEFAULT 'SENT',
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "respondedAt"    TIMESTAMPTZ
);
CREATE INDEX "Proposal_org_status_idx" ON "Proposal"("organizationId","status");

ALTER TABLE "Contract"
  ADD CONSTRAINT "Contract_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id");

-- ---------- FINANCEIRO ----------
CREATE TABLE "Commission" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "contractId"     TEXT NOT NULL REFERENCES "Contract"("id"),
  "agentId"        TEXT NOT NULL REFERENCES "Agent"("id"),
  "amount"         DECIMAL(12,2) NOT NULL,
  "status"         "CommissionStatus" NOT NULL DEFAULT 'PENDING',
  "paidAt"         TIMESTAMPTZ
);
CREATE INDEX "Commission_org_agent_status_idx" ON "Commission"("organizationId","agentId","status");

CREATE TABLE "FinanceEntry" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "contractId"     TEXT REFERENCES "Contract"("id"),
  "direction"      "FlowDir" NOT NULL,
  "category"       "FinCategory" NOT NULL,
  "description"    TEXT NOT NULL,
  "amount"         DECIMAL(14,2) NOT NULL,
  "dueDate"        TIMESTAMPTZ NOT NULL,
  "paidAt"         TIMESTAMPTZ
);
CREATE INDEX "FinanceEntry_org_due_idx"     ON "FinanceEntry"("organizationId","dueDate");
CREATE INDEX "FinanceEntry_org_dir_cat_idx" ON "FinanceEntry"("organizationId","direction","category");

CREATE TABLE "Goal" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "agentId"        TEXT REFERENCES "Agent"("id"),
  "year"           INTEGER NOT NULL,
  "month"          INTEGER NOT NULL,
  "targetAmount"   DECIMAL(14,2) NOT NULL,
  UNIQUE ("organizationId","agentId","year","month")
);

-- ---------- CONTEÚDO ----------
CREATE TABLE "BlogPost" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "slug"           TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "excerpt"        TEXT,
  "content"        TEXT NOT NULL,
  "coverImage"     TEXT,
  "author"         TEXT,
  "tags"           TEXT[] NOT NULL DEFAULT '{}',
  "published"      BOOLEAN NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("organizationId","slug")
);
CREATE INDEX "BlogPost_org_pub_date_idx" ON "BlogPost"("organizationId","published","createdAt");

CREATE TABLE "Testimonial" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "text"           TEXT NOT NULL,
  "author"         TEXT NOT NULL,
  "context"        TEXT,
  "rating"         INTEGER NOT NULL DEFAULT 5,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Testimonial_organizationId_idx" ON "Testimonial"("organizationId");
