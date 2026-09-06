import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const org = await prisma.organization.findFirst({ orderBy: { createdAt: 'asc' } })
  const contact = await prisma.contact.findFirst({ where: { organizationId: org.id, email: 'cliente@teste.com' } })
  if (!contact) throw new Error('Cliente teste não encontrado. Rode criar-cliente.mjs primeiro')
  
  const property = await prisma.property.findFirst({ where: { organizationId: org.id } })
  if (!property) throw new Error('Nenhum imóvel encontrado')

  // cria lead se não existir
  let lead = await prisma.lead.findFirst({ where: { organizationId: org.id, contactId: contact.id, propertyId: property.id } })
  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        organizationId: org.id,
        contactId: contact.id,
        propertyId: property.id,
        stage: 'PROPOSAL',
        source: 'SITE',
      }
    })
  }

  const proposal = await prisma.proposal.create({
    data: {
      organizationId: org.id,
      contactId: contact.id,
      propertyId: property.id,
      leadId: lead.id,
      amount: Number(property.price) * 0.95, // 5% abaixo
      conditions: 'Sinal de 20% + financiamento bancário + FGTS',
      status: 'SENT',
    }
  })

  console.log(`\n✅ PROPOSTA CRIADA!`)
  console.log(`Imóvel: ${property.title} - R$ ${property.price}`)
  console.log(`Oferta: R$ ${proposal.amount} - ${proposal.status}`)
  console.log(`Cliente: ${contact.email}`)
  console.log(`\nVeja em: /cliente/portal/propostas`)
}

main().finally(()=>prisma.$disconnect())
