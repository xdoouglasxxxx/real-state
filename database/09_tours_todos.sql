-- =====================================================================
-- TOURS VIRTUAIS EM TODOS OS IMÓVEIS DISPONÍVEIS DA MAISON (demo)
-- IDs de espaços públicos conhecidos da Matterport. Se algum mostrar
-- "model not available", troque o ID: veja instruções no chat/README.
-- Re-executável: limpa e recria só os tours da Maison.
-- =====================================================================

DELETE FROM "PropertyMedia"
WHERE kind = 'VIRTUAL_TOUR'
  AND "propertyId" IN (SELECT id FROM "Property" WHERE "organizationId" = 'org_maison');

INSERT INTO "PropertyMedia" ("id","propertyId",kind,url,"sortOrder") VALUES
('dm_tr1','dm_p1','VIRTUAL_TOUR','https://my.matterport.com/show/?m=SxQL3iGyoDo',999),
('dm_tr2','dm_p2','VIRTUAL_TOUR','https://my.matterport.com/show/?m=JGPnGQ6hosj',999),
('dm_tr3','dm_p3','VIRTUAL_TOUR','https://my.matterport.com/show/?m=Zh14WDtkjdC',999),
('dm_tr4','dm_p4','VIRTUAL_TOUR','https://my.matterport.com/show/?m=aSx1zpxjq6C',999),
('dm_tr5','dm_p5','VIRTUAL_TOUR','https://my.matterport.com/show/?m=nrxTH73BS1w',999),
('dm_tr6','dm_p6','VIRTUAL_TOUR','https://my.matterport.com/show/?m=j4RZx7ZGM6T',999);
