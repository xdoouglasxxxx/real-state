-- =====================================================================
-- SEED — organização demo "Maison Estate" com dados realistas
-- (imóveis, corretores, funil de leads completo, financeiro, metas)
-- =====================================================================

-- Tenant
INSERT INTO "Organization" ("id","name","slug","creci","phone","email","city") VALUES
('org_maison','Maison Estate','maison','CRECI-SP 45.120-J','(11) 3040-8800','contato@maisonestate.com.br','São Paulo');

INSERT INTO "Domain" ("id","host","isPrimary","organizationId") VALUES
('dom_1','www.maisonestate.com.br',true,'org_maison');

INSERT INTO "Subscription" ("id","organizationId","plan","status") VALUES
('sub_1','org_maison','PRO','ACTIVE');

-- Usuários e corretores
INSERT INTO "User" ("id","email","name","role","organizationId") VALUES
('usr_admin','admin@maisonestate.com.br','Administração','ORG_ADMIN','org_maison'),
('usr_helena','helena@maisonestate.com.br','Helena Duarte','MANAGER','org_maison'),
('usr_rafael','rafael@maisonestate.com.br','Rafael Moreno','AGENT','org_maison'),
('usr_beatriz','beatriz@maisonestate.com.br','Beatriz Lins','AGENT','org_maison');

INSERT INTO "Agent" ("id","organizationId","userId","name","creci","phone","email","commissionPct","isFeatured","photoUrl","bio") VALUES
('agt_helena','org_maison','usr_helena','Helena Duarte','CRECI 98.541','(11) 99812-4455','helena@maisonestate.com.br',3.0,true,'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80','Fundadora. 14 anos no alto padrão paulistano.'),
('agt_rafael','org_maison','usr_rafael','Rafael Moreno','CRECI 112.030','(11) 99633-2210','rafael@maisonestate.com.br',2.5,true,'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80','Especialista em coberturas e arquitetura assinada.'),
('agt_beatriz','org_maison','usr_beatriz','Beatriz Lins','CRECI 105.877','(11) 98770-9034','beatriz@maisonestate.com.br',2.5,true,'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80','Consultora de compra assessorada nos Jardins/Itaim.');

-- Contatos (proprietários e compradores)
INSERT INTO "Contact" ("id","organizationId","kind","name","phone","email") VALUES
('cnt_prop1','org_maison','OWNER','Marcos Vilela','(11) 98111-2233','marcos.v@email.com'),
('cnt_prop2','org_maison','OWNER','Sônia Prado','(11) 97444-5566','sonia.p@email.com'),
('cnt_douglas','org_maison','BUYER','Douglas Ferreira','(11) 96777-8899','douglas.f@email.com'),
('cnt_carla','org_maison','BUYER','Carla Mendes','(11) 95222-3344','carla.m@email.com'),
('cnt_otavio','org_maison','BUYER','Otávio Nunes','(11) 94555-6677','otavio.n@email.com');

-- Imóveis
INSERT INTO "Property" ("id","organizationId","slug","title","description","type","status","price","neighborhood","city","state","latitude","longitude","bedrooms","bathrooms","suites","parkingSpaces","areaM2","features","ownerId","agentId","isFeatured","publishedAt") VALUES
('prp_vale','org_maison','casa-do-vale','Casa do Vale','Residência contemporânea integrada à mata nativa, pé-direito duplo, piscina de borda infinita e automação completa.','HOUSE','FOR_SALE',4850000,'Alphaville','Barueri','SP',-23.4995,-46.8497,5,6,4,4,620,'{"Piscina aquecida","Adega climatizada","Home theater","Energia solar"}','cnt_prop1','agt_helena',true,now() - interval '35 days'),
('prp_horizonte','org_maison','penthouse-horizonte','Penthouse Horizonte','Cobertura duplex com vista de 270° para o skyline, terraço gourmet com spa e elevador privativo.','APARTMENT','FOR_SALE',7200000,'Itaim Bibi','São Paulo','SP',-23.585,-46.676,4,5,4,3,410,'{"Vista panorâmica","Elevador privativo","Spa no terraço"}','cnt_prop2','agt_rafael',true,now() - interval '28 days'),
('prp_serra','org_maison','refugio-da-serra','Refúgio da Serra','Chalé de montanha em condomínio fechado, lareira de pedra e deck voltado para o vale.','HOUSE','FOR_SALE',3100000,'Capivari','Campos do Jordão','SP',-22.7386,-45.5913,4,4,2,2,380,'{"Lareira de pedra","Piso aquecido","Sauna seca"}','cnt_prop1','agt_beatriz',true,now() - interval '120 days'),
('prp_loft','org_maison','loft-jardins','Loft Jardins','Loft de teto alto com estrutura aparente e marcenaria sob medida, a dois quarteirões da Oscar Freire.','APARTMENT','FOR_SALE',1850000,'Jardins','São Paulo','SP',-23.565,-46.669,1,2,1,1,110,'{"Pé-direito 4,2 m","Mobiliado","Rooftop"}','cnt_prop2','agt_beatriz',false,now() - interval '95 days'),
('prp_villa','org_maison','villa-mar-azul','Villa Mar Azul','Frente-mar absoluta com acesso direto à areia, piscina de raia 25 m e casa de hóspedes.','HOUSE','EXCLUSIVE',9500000,'Riviera de São Lourenço','Bertioga','SP',-23.79,-46.03,6,8,6,6,780,'{"Frente-mar","Piscina de raia 25 m","Casa de hóspedes","Gerador"}','cnt_prop1','agt_helena',true,now() - interval '15 days'),
('prp_studio','org_maison','estudio-pinheiros','Estúdio Pinheiros','Estúdio inteligente em prédio novo, planta otimizada e varanda envidraçada.','APARTMENT','SOLD',890000,'Pinheiros','São Paulo','SP',-23.561,-46.702,1,1,0,0,54,'{"Prédio novo","Coworking","Rooftop com piscina"}','cnt_prop2','agt_rafael',false,now() - interval '200 days');

-- Mídia (fotos + tour virtual de exemplo)
INSERT INTO "PropertyMedia" ("id","propertyId","kind","url","sortOrder") VALUES
('med_1','prp_vale','PHOTO','https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',0),
('med_2','prp_vale','PHOTO','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',1),
('med_3','prp_vale','VIRTUAL_TOUR','https://my.matterport.com/show/?m=EXEMPLO',2),
('med_4','prp_horizonte','PHOTO','https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',0),
('med_5','prp_serra','PHOTO','https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200&q=80',0),
('med_6','prp_loft','PHOTO','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',0),
('med_7','prp_villa','PHOTO','https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',0),
('med_8','prp_studio','PHOTO','https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80',0);

-- Funil: o lead "Douglas" (fluxo completo até financiamento)
INSERT INTO "Lead" ("id","organizationId","contactId","propertyId","agentId","source","stage","score","budgetMax","interest","createdAt") VALUES
('led_douglas','org_maison','cnt_douglas','prp_loft','agt_beatriz','INSTAGRAM','FINANCING',85,2000000,'Apartamento até 2 mi nos Jardins/Pinheiros',now() - interval '21 days'),
('led_carla','org_maison','cnt_carla','prp_horizonte','agt_rafael','SITE','VISIT',60,7500000,'Cobertura com vista no Itaim',now() - interval '7 days'),
('led_otavio','org_maison','cnt_otavio',NULL,'agt_helena','WHATSAPP','NEW',30,5000000,'Casa em condomínio, Alphaville',now() - interval '1 day');

INSERT INTO "Activity" ("id","leadId","type","payload","createdAt") VALUES
('act_1','led_douglas','PAGE_VIEW','{"page":"instagram_ad","ref":"campanha_jardins"}',now() - interval '21 days'),
('act_2','led_douglas','PAGE_VIEW','{"page":"/imovel/loft-jardins"}',now() - interval '21 days'),
('act_3','led_douglas','FORM_SUBMIT','{"form":"agendar_visita"}',now() - interval '20 days'),
('act_4','led_douglas','WHATSAPP_SENT','{"template":"boas_vindas"}',now() - interval '20 days'),
('act_5','led_douglas','STAGE_CHANGE','{"from":"CONTACTED","to":"VISIT"}',now() - interval '18 days'),
('act_6','led_douglas','STAGE_CHANGE','{"from":"VISIT","to":"PROPOSAL"}',now() - interval '10 days'),
('act_7','led_douglas','STAGE_CHANGE','{"from":"PROPOSAL","to":"FINANCING"}',now() - interval '3 days');

-- Visitas
INSERT INTO "Visit" ("id","organizationId","propertyId","leadId","contactId","agentId","scheduledAt","status","feedback") VALUES
('vis_1','org_maison','prp_loft','led_douglas','cnt_douglas','agt_beatriz',now() - interval '18 days','DONE','Adorou a localização; quer segunda visita com a esposa.'),
('vis_2','org_maison','prp_loft','led_douglas','cnt_douglas','agt_beatriz',now() - interval '14 days','DONE','Decidiu fazer proposta.'),
('vis_3','org_maison','prp_horizonte','led_carla','cnt_carla','agt_rafael',now() + interval '2 days','SCHEDULED',NULL);

-- Proposta -> contrato -> comissão (venda do estúdio, concluída)
INSERT INTO "Proposal" ("id","organizationId","propertyId","leadId","contactId","amount","conditions","status","createdAt","respondedAt") VALUES
('pro_douglas','org_maison','prp_loft','led_douglas','cnt_douglas',1780000,'Financiado 60%, sinal de 40%','SENT',now() - interval '10 days',NULL),
('pro_studio','org_maison','prp_studio',NULL,'cnt_carla',870000,'À vista','ACCEPTED',now() - interval '60 days',now() - interval '55 days');

INSERT INTO "Contract" ("id","organizationId","proposalId","status","totalAmount","signedAt","closedAt") VALUES
('ctr_studio','org_maison','pro_studio','CLOSED',870000,now() - interval '50 days',now() - interval '20 days');

INSERT INTO "Commission" ("id","organizationId","contractId","agentId","amount","status","paidAt") VALUES
('com_studio','org_maison','ctr_studio','agt_rafael',21750,'PAID',now() - interval '15 days');

-- Financeiro (fluxo de caixa)
INSERT INTO "FinanceEntry" ("id","organizationId","contractId","direction","category","description","amount","dueDate","paidAt") VALUES
('fin_1','org_maison','ctr_studio','IN','COMISSAO_RECEBIDA','Comissão venda Estúdio Pinheiros (5%)',43500,now() - interval '20 days',now() - interval '18 days'),
('fin_2','org_maison','ctr_studio','OUT','COMISSAO_PAGA','Repasse corretor Rafael (50%)',21750,now() - interval '15 days',now() - interval '15 days'),
('fin_3','org_maison',NULL,'OUT','IMPOSTO','ISS + IRPJ estimado',6525,now() - interval '10 days',now() - interval '10 days'),
('fin_4','org_maison',NULL,'OUT','MARKETING','Tráfego pago Instagram/Google',4800,now() - interval '5 days',now() - interval '5 days'),
('fin_5','org_maison',NULL,'OUT','PRO_LABORE','Pró-labore sócios',12000,now() + interval '5 days',NULL),
('fin_6','org_maison',NULL,'OUT','DESPESA_FIXA','Aluguel escritório + condomínio',8500,now() + interval '5 days',NULL);

-- Metas (casa e por corretor, mês corrente)
INSERT INTO "Goal" ("id","organizationId","agentId","year","month","targetAmount") VALUES
('gol_org','org_maison',NULL,EXTRACT(YEAR FROM now())::int,EXTRACT(MONTH FROM now())::int,15000000),
('gol_hel','org_maison','agt_helena',EXTRACT(YEAR FROM now())::int,EXTRACT(MONTH FROM now())::int,6000000),
('gol_raf','org_maison','agt_rafael',EXTRACT(YEAR FROM now())::int,EXTRACT(MONTH FROM now())::int,5000000),
('gol_bea','org_maison','agt_beatriz',EXTRACT(YEAR FROM now())::int,EXTRACT(MONTH FROM now())::int,4000000);

-- Conteúdo do site
INSERT INTO "Testimonial" ("id","organizationId","text","author","context") VALUES
('tst_1','org_maison','Vendemos nossa casa em 28 dias, acima do valor que esperávamos.','Família Sampaio','Venderam em Alphaville'),
('tst_2','org_maison','A segunda visita já era o imóvel certo. Eles ouvem de verdade.','Carla & Diego M.','Compraram no Itaim'),
('tst_3','org_maison','Acompanhamento jurídico impecável do início ao fim.','Dr. Otávio Ferreira','Comprou nos Jardins');

INSERT INTO "BlogPost" ("id","organizationId","slug","title","excerpt","content","author","tags") VALUES
('blg_1','org_maison','vale-a-pena-comprar-na-planta','Vale a pena comprar na planta em 2026?','Os cenários em que ainda faz sentido — e os que não.','Comprar na planta já foi sinônimo de valorização garantida. Hoje, a conta é mais fina...','Helena Duarte','{"mercado","investimento"}');
