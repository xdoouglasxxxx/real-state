-- =====================================================================
-- MAISON ESTATE — DEMONSTRAÇÃO COMPLETA (para mostrar a clientes)
-- Rodar no SQL Editor do Supabase. PODE RODAR QUANTAS VEZES QUISER:
-- apaga e recria só os dados da Maison (org_maison), sem tocar em
-- nenhum outro tenant.
--
-- LOGIN DEMO DO PAINEL (/login):
--   e-mail: demo@maisonestate.com.br
--   senha : MaisonDemo2026
-- =====================================================================

-- ---------- LIMPEZA (ordem segura de FKs) ----------
DELETE FROM "Commission"   WHERE "organizationId" = 'org_maison';
DELETE FROM "FinanceEntry" WHERE "organizationId" = 'org_maison';
DELETE FROM "Document"     WHERE "contractId" IN (SELECT id FROM "Contract" WHERE "organizationId" = 'org_maison');
DELETE FROM "Contract"     WHERE "organizationId" = 'org_maison';
DELETE FROM "Proposal"     WHERE "organizationId" = 'org_maison';
DELETE FROM "Visit"        WHERE "organizationId" = 'org_maison';
DELETE FROM "Activity"     WHERE "leadId" IN (SELECT id FROM "Lead" WHERE "organizationId" = 'org_maison');
DELETE FROM "Favorite"     WHERE "contactId" IN (SELECT id FROM "Contact" WHERE "organizationId" = 'org_maison');
DELETE FROM "Lead"         WHERE "organizationId" = 'org_maison';
DELETE FROM "PropertyEvent" WHERE "propertyId" IN (SELECT id FROM "Property" WHERE "organizationId" = 'org_maison');
DELETE FROM "PropertyMedia" WHERE "propertyId" IN (SELECT id FROM "Property" WHERE "organizationId" = 'org_maison');
DELETE FROM "Document"     WHERE "propertyId" IN (SELECT id FROM "Property" WHERE "organizationId" = 'org_maison');
DELETE FROM "Property"     WHERE "organizationId" = 'org_maison';
DELETE FROM "Contact"      WHERE "organizationId" = 'org_maison';
DELETE FROM "Goal"         WHERE "organizationId" = 'org_maison';
DELETE FROM "Testimonial"  WHERE "organizationId" = 'org_maison';
DELETE FROM "BlogPost"     WHERE "organizationId" = 'org_maison';
DELETE FROM "Agent"        WHERE "organizationId" = 'org_maison';

-- ---------- ORGANIZAÇÃO (upsert: cria ou atualiza, com login demo) ----------
INSERT INTO "Organization" (id, name, slug, creci, phone, email, city, state,
  "themeInk", "themeBrass", "themeCream", "adminEmail", "panelPassHash", "createdAt", "updatedAt")
VALUES ('org_maison', 'Maison Estate', 'maison', 'CRECI-SP 45.120-J', '(11) 3040-8800',
  'contato@maisonestate.com.br', 'São Paulo', 'SP',
  '#17130e', '#c6a15b', '#f4efe4',
  'demo@maisonestate.com.br', 'f2360852a1e3de04425ffeae2128aa36:3e49e06815d9bba53f89f29f4b1ed00c63b1b17880d7c9db9d8f315c4f17f08c0465965923004a9106b69c64b84aa0975c8424eb6ff6a60c162c9ca05388aa9b', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  "adminEmail" = EXCLUDED."adminEmail",
  "panelPassHash" = EXCLUDED."panelPassHash",
  name = EXCLUDED.name, slug = EXCLUDED.slug;

INSERT INTO "Subscription" (id, "organizationId", plan, status, "createdAt", "updatedAt")
VALUES ('sub_maison', 'org_maison', 'PRO', 'ACTIVE', NOW() - interval '90 days', NOW())
ON CONFLICT ("organizationId") DO UPDATE SET plan = 'PRO', status = 'ACTIVE';

-- ---------- CORRETORES ----------
INSERT INTO "Agent" (id, "organizationId", name, creci, phone, email, "photoUrl", bio, "isFeatured", "isActive", "createdAt") VALUES
('dm_ag1','org_maison','Beatriz Lins','CRECI 118.402','(11) 98801-2201','beatriz@maisonestate.com.br','https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80','Especialista em Jardins e Itaim. 12 anos de mercado.',true,true,NOW() - interval '80 days'),
('dm_ag2','org_maison','Rafael Moreno','CRECI 132.977','(11) 98802-3302','rafael@maisonestate.com.br','https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80','Alto padrão em Alphaville e condomínios fechados.',true,true,NOW() - interval '78 days'),
('dm_ag3','org_maison','Helena Duarte','CRECI 121.554','(11) 98803-4403','helena@maisonestate.com.br','https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80','Litoral norte: Riviera e Baleia. Atendimento em inglês.',true,true,NOW() - interval '75 days'),
('dm_ag4','org_maison','Tiago Sampaio','CRECI 140.221','(11) 98804-5504','tiago@maisonestate.com.br','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80','Investimentos e permutas.',false,true,NOW() - interval '60 days');

-- ---------- IMÓVEIS ----------
INSERT INTO "Property" (id, "organizationId", slug, title, description, type, status, price, "condoFee", "iptuYearly",
  neighborhood, city, state, latitude, longitude, bedrooms, bathrooms, suites, "parkingSpaces", "areaM2",
  features, "agentId", "isFeatured", "publishedAt", "createdAt", "updatedAt") VALUES
('dm_p1','org_maison','casa-do-vale','Casa do Vale',
 'Projeto assinado com pé-direito duplo, piscina com raia de 20 m e paisagismo de Burle Marx Studio. Automação completa, adega climatizada para 400 rótulos e energia solar.',
 'HOUSE','FOR_SALE',4850000,2800,38000,'Alphaville','Barueri','SP',-23.5063,-46.8508,5,6,4,4,620,
 ARRAY['Piscina com raia','Adega climatizada','Automação','Energia solar','Home theater'],'dm_ag2',true,NOW() - interval '45 days',NOW() - interval '45 days',NOW()),
('dm_p2','org_maison','penthouse-horizonte','Penthouse Horizonte',
 'Cobertura duplex com vista de 270° para o skyline. Terraço gourmet com spa aquecido, 4 suítes e 6 vagas. Lazer de resort no condomínio.',
 'APARTMENT','FOR_SALE',7200000,6500,52000,'Itaim Bibi','São Paulo','SP',-23.5843,-46.6766,4,5,4,6,410,
 ARRAY['Vista 270°','Spa no terraço','6 vagas','Lazer completo'],'dm_ag1',true,NOW() - interval '40 days',NOW() - interval '40 days',NOW()),
('dm_p3','org_maison','villa-mar-azul','Villa Mar Azul',
 'Pé na areia na Riviera de São Lourenço. 6 suítes com vista mar, deck com piscina de borda infinita e acesso privativo à praia.',
 'HOUSE','EXCLUSIVE',9500000,4200,61000,'Riviera de São Lourenço','Bertioga','SP',-23.7947,-46.2258,6,8,6,6,780,
 ARRAY['Pé na areia','Borda infinita','6 suítes','Acesso privativo'],'dm_ag3',true,NOW() - interval '35 days',NOW() - interval '35 days',NOW()),
('dm_p4','org_maison','loft-jardins','Loft Jardins',
 'Loft de 180 m² em rua arborizada dos Jardins. Pé-direito de 5 m, cozinha integrada e varanda com jardim vertical.',
 'APARTMENT','FOR_SALE',2350000,2100,18500,'Jardins','São Paulo','SP',-23.5629,-46.6698,2,3,2,2,180,
 ARRAY['Pé-direito 5m','Jardim vertical','Rua arborizada'],'dm_ag1',false,NOW() - interval '30 days',NOW() - interval '30 days',NOW()),
('dm_p5','org_maison','refugio-serra','Refúgio da Serra',
 'Casa de campo em condomínio na Serra da Cantareira: lareira, sauna, pomar e nascente própria em terreno de 5.000 m².',
 'HOUSE','FOR_SALE',3900000,1900,21000,'Serra da Cantareira','Mairiporã','SP',-23.3745,-46.5871,4,5,3,6,520,
 ARRAY['Terreno 5.000m²','Nascente','Sauna','Pomar'],'dm_ag4',false,NOW() - interval '25 days',NOW() - interval '25 days',NOW()),
('dm_p6','org_maison','garden-moema','Garden Moema',
 'Garden de 240 m² com quintal gramado de 90 m², churrasqueira própria e 3 suítes. A 400 m do Parque Ibirapuera.',
 'APARTMENT','RESERVED',3150000,3200,24000,'Moema','São Paulo','SP',-23.6014,-46.6653,3,4,3,3,240,
 ARRAY['Quintal 90m²','Churrasqueira','Ao lado do Ibirapuera'],'dm_ag2',false,NOW() - interval '20 days',NOW() - interval '20 days',NOW()),
('dm_p7','org_maison','mansao-tambore','Mansão Tamboré',
 'Vendida em 28 dias pela equipe Maison. Mantida no portfólio como referência de resultado.',
 'HOUSE','SOLD',6800000,3100,44000,'Tamboré','Santana de Parnaíba','SP',-23.4735,-46.8369,5,7,5,6,720,
 ARRAY['Vendida em 28 dias'],'dm_ag2',false,NOW() - interval '70 days',NOW() - interval '70 days',NOW());

-- ---------- FOTOS + TOUR ----------
INSERT INTO "PropertyMedia" ("id","propertyId",kind,url,"sortOrder","uploadedAt") VALUES
('dm_m1','dm_p1','PHOTO','https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=80',0,NOW()),
('dm_m2','dm_p1','PHOTO','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80',1,NOW()),
('dm_m3','dm_p1','PHOTO','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80',2,NOW()),
('dm_m4','dm_p1','VIRTUAL_TOUR','https://my.matterport.com/show/?m=zEWsxhZpGba',999,NOW()),
('dm_m5','dm_p2','PHOTO','https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80',0,NOW()),
('dm_m6','dm_p2','PHOTO','https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1600&q=80',1,NOW()),
('dm_m7','dm_p2','PHOTO','https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1600&q=80',2,NOW()),
('dm_m8','dm_p3','PHOTO','https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80',0,NOW()),
('dm_m9','dm_p3','PHOTO','https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&q=80',1,NOW()),
('dm_m10','dm_p3','PHOTO','https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1600&q=80',2,NOW()),
('dm_m11','dm_p4','PHOTO','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=80',0,NOW()),
('dm_m12','dm_p4','PHOTO','https://images.unsplash.com/photo-1615873968403-89e068629265?w=1600&q=80',1,NOW()),
('dm_m13','dm_p5','PHOTO','https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1600&q=80',0,NOW()),
('dm_m14','dm_p5','PHOTO','https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=1600&q=80',1,NOW()),
('dm_m15','dm_p6','PHOTO','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=80',0,NOW()),
('dm_m16','dm_p6','PHOTO','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1600&q=80',1,NOW()),
('dm_m17','dm_p7','PHOTO','https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80',0,NOW());

-- ---------- DEPOIMENTOS + BLOG ----------
INSERT INTO "Testimonial" (id,"organizationId",text,author,context,rating,"createdAt") VALUES
('dm_t1','org_maison','Vendemos nossa casa em 28 dias, acima do valor que esperávamos.','Família Sampaio','Venderam em Alphaville',5,NOW() - interval '50 days'),
('dm_t2','org_maison','A segunda visita já era o imóvel certo. Eles ouvem de verdade.','Carla & Diego M.','Compraram no Itaim',5,NOW() - interval '38 days'),
('dm_t3','org_maison','Acompanhamento jurídico impecável do início ao fim.','Dr. Otávio Ferreira','Comprou nos Jardins',5,NOW() - interval '22 days');

INSERT INTO "BlogPost" (id,"organizationId",slug,title,excerpt,content,"coverImage",author,tags,published,"createdAt") VALUES
('dm_b1','org_maison','guia-alto-padrao-2026','O guia do alto padrão em 2026','O que muda no mercado de luxo paulistano — e onde estão as oportunidades.','O mercado de alto padrão em São Paulo vive um momento singular. Com estoque restrito nos bairros consolidados e demanda aquecida, os imóveis com projeto de autor e lazer privativo lideram a valorização... (conteúdo demonstrativo)','https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&q=80','Beatriz Lins',ARRAY['mercado','alto padrão'],true,NOW() - interval '18 days'),
('dm_b2','org_maison','vale-a-pena-permuta','Permuta: quando vale a pena?','Trocar um ativo por outro pode destravar negócios — se bem estruturado.','A permuta imobiliária voltou ao radar dos investidores. Estruturada corretamente, elimina fricções de liquidez... (conteúdo demonstrativo)','https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80','Tiago Sampaio',ARRAY['investimento'],true,NOW() - interval '10 days'),
('dm_b3','org_maison','checklist-documentos','Checklist: documentos para vender sem sustos','A due diligence que evita 90% dos atrasos de escritura.','Matrícula atualizada, certidões fiscais, condomínio quite... a lista parece longa, mas com organização o processo flui... (conteúdo demonstrativo)','https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&q=80','Helena Duarte',ARRAY['jurídico','venda'],true,NOW() - interval '4 days');

-- ---------- CONTATOS + FUNIL COMPLETO ----------
INSERT INTO "Contact" (id,"organizationId",kind,name,phone,email,"createdAt") VALUES
('dm_c1','org_maison','BUYER','Douglas Ferreira','(41) 99900-3524','douglas@email.com',NOW() - interval '12 days'),
('dm_c2','org_maison','BUYER','Carla Mendes','(11) 98888-7777','carla@email.com',NOW() - interval '9 days'),
('dm_c3','org_maison','BUYER','Otávio Nunes','(11) 97777-6666','otavio@email.com',NOW() - interval '2 days'),
('dm_c4','org_maison','BUYER','Mariana Costa','(11) 96666-5555','mariana@email.com',NOW() - interval '1 days'),
('dm_c5','org_maison','BUYER','Pedro Albuquerque','(11) 95555-4444','pedro@email.com',NOW() - interval '6 days'),
('dm_c6','org_maison','BUYER','Fernanda Ryu','(11) 94444-3333','fernanda@email.com',NOW() - interval '15 days'),
('dm_c7','org_maison','BUYER','Grupo Andrade (holding)','(11) 93333-2222','holding@andrade.com',NOW() - interval '20 days'),
('dm_c8','org_maison','OWNER','Sérgio Tavares','(11) 92222-1111','sergio@email.com',NOW() - interval '25 days');

INSERT INTO "Lead" (id,"organizationId","contactId","propertyId","agentId",source,stage,interest,"createdAt","updatedAt") VALUES
('dm_l1','org_maison','dm_c4','dm_p4','dm_ag1','SITE','NEW','Loft ou garden até 2,5 mi nos Jardins',NOW() - interval '1 days',NOW() - interval '1 days'),
('dm_l2','org_maison','dm_c3','dm_p1','dm_ag2','WHATSAPP','NEW','Casa em condomínio, mudança em 6 meses',NOW() - interval '2 days',NOW() - interval '2 days'),
('dm_l3','org_maison','dm_c5','dm_p5','dm_ag4','INSTAGRAM','CONTACTED','Casa de campo para fins de semana',NOW() - interval '6 days',NOW() - interval '3 days'),
('dm_l4','org_maison','dm_c2','dm_p2','dm_ag1','SITE','VISIT','Cobertura com vista, 4 suítes',NOW() - interval '9 days',NOW() - interval '2 days'),
('dm_l5','org_maison','dm_c1','dm_p4','dm_ag1','INSTAGRAM','FINANCING','Apartamento no centro expandido',NOW() - interval '12 days',NOW() - interval '1 days'),
('dm_l6','org_maison','dm_c6','dm_p6','dm_ag2','INDICACAO','CONTRACT','Garden perto do Ibirapuera',NOW() - interval '15 days',NOW() - interval '2 days'),
('dm_l7','org_maison','dm_c7','dm_p7','dm_ag2','PORTAL','WON','Mansão para diretoria',NOW() - interval '20 days',NOW() - interval '5 days'),
('dm_l8','org_maison','dm_c8',NULL,'dm_ag3','SITE','CONTACTED','Quer VENDER casa na Riviera (captação)',NOW() - interval '4 days',NOW() - interval '1 days');

INSERT INTO "Activity" (id,"leadId",type,payload,"createdAt") VALUES
('dm_a1','dm_l1','FORM_SUBMIT','{"kind":"visit","message":"Gostaria de conhecer o Loft Jardins"}',NOW() - interval '1 days'),
('dm_a2','dm_l1','NOTE','{"note":"Distribuído automaticamente para Beatriz Lins (rodízio)"}',NOW() - interval '1 days'),
('dm_a3','dm_l3','WHATSAPP_SENT','{"message":"Enviado portfólio de casas na Cantareira"}',NOW() - interval '3 days'),
('dm_a4','dm_l3','STAGE_CHANGE','{"from":"NEW","to":"CONTACTED"}',NOW() - interval '3 days'),
('dm_a5','dm_l4','STAGE_CHANGE','{"from":"CONTACTED","to":"VISIT"}',NOW() - interval '2 days'),
('dm_a6','dm_l4','NOTE','{"note":"Visita agendada — prefere fim de tarde para ver o pôr do sol"}',NOW() - interval '2 days'),
('dm_a7','dm_l5','STAGE_CHANGE','{"from":"PROPOSAL","to":"FINANCING"}',NOW() - interval '1 days'),
('dm_a8','dm_l5','NOTE','{"note":"Banco pediu IR complementar; previsão de aprovação em 10 dias"}',NOW() - interval '1 days'),
('dm_a9','dm_l6','STAGE_CHANGE','{"from":"FINANCING","to":"CONTRACT"}',NOW() - interval '2 days'),
('dm_a10','dm_l7','STAGE_CHANGE','{"from":"CONTRACT","to":"WON"}',NOW() - interval '5 days'),
('dm_a11','dm_l7','NOTE','{"note":"Escriturado! Comissão liberada. 🎉"}',NOW() - interval '5 days'),
('dm_a12','dm_l8','NOTE','{"note":"Captação: proprietário quer avaliação em 48h"}',NOW() - interval '1 days');

-- ---------- AGENDA (2 futuras, 1 realizada, 1 no-show) ----------
INSERT INTO "Visit" (id,"organizationId","propertyId","leadId","contactId","agentId","scheduledAt",status,"createdAt") VALUES
('dm_v1','org_maison','dm_p2','dm_l4','dm_c2','dm_ag1',NOW() + interval '1 day' + interval '10 hours' - (EXTRACT(hour FROM NOW()) || ' hours')::interval,'SCHEDULED',NOW()),
('dm_v2','org_maison','dm_p4','dm_l1','dm_c4','dm_ag1',NOW() + interval '2 days' + interval '15 hours' - (EXTRACT(hour FROM NOW()) || ' hours')::interval,'SCHEDULED',NOW()),
('dm_v3','org_maison','dm_p6','dm_l6','dm_c6','dm_ag2',NOW() - interval '3 days','DONE',NOW() - interval '4 days'),
('dm_v4','org_maison','dm_p5','dm_l3','dm_c5','dm_ag4',NOW() - interval '1 day','NO_SHOW',NOW() - interval '2 days');

-- ---------- PROPOSTAS / CONTRATOS / COMISSÃO / META ----------
INSERT INTO "Proposal" (id,"organizationId","propertyId","leadId","contactId",amount,conditions,status,"createdAt","respondedAt") VALUES
('dm_pr1','org_maison','dm_p4','dm_l5','dm_c1',2250000,'70% financiado + FGTS','SENT',NOW() - interval '3 days',NULL),
('dm_pr2','org_maison','dm_p6','dm_l6','dm_c6',3050000,'À vista com desconto','ACCEPTED',NOW() - interval '8 days',NOW() - interval '4 days'),
('dm_pr3','org_maison','dm_p7','dm_l7','dm_c7',6800000,'À vista','ACCEPTED',NOW() - interval '18 days',NOW() - interval '15 days');

INSERT INTO "Contract" (id,"organizationId","proposalId",status,"totalAmount","signedAt","closedAt","createdAt") VALUES
('dm_ct1','org_maison','dm_pr2','AWAITING_SIGNATURE',3050000,NULL,NULL,NOW() - interval '2 days'),
('dm_ct2','org_maison','dm_pr3','CLOSED',6800000,NOW() - interval '10 days',NOW() - interval '5 days',NOW() - interval '14 days');

INSERT INTO "Commission" (id,"organizationId","contractId","agentId",amount,status,"paidAt") VALUES
('dm_cm1','org_maison','dm_ct2','dm_ag2',170000,'PAID',NOW() - interval '3 days');

INSERT INTO "Goal" (id,"organizationId","agentId",year,month,"targetAmount") VALUES
('dm_g1','org_maison',NULL,EXTRACT(year FROM NOW())::int,EXTRACT(month FROM NOW())::int,12000000);
