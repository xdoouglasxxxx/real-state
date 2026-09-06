import { PrismaClient } from '@prisma/client'
import { randomBytes, scryptSync } from 'crypto'

const prisma = new PrismaClient()

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}` // formato que seu src/lib/auth.ts usa
}

async function main() {
  const org = await prisma.organization.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!org) throw new Error('Nenhuma Organization encontrada - cria uma imobiliária primeiro')

  const email = 'cliente@teste.com'
  const senha = '123456'

  console.log(`Usando tenant: ${org.name} (${org.id})`)

  // limpa se já existir
  const existingUser = await prisma.user.findFirst({ where: { organizationId: org.id, email } })
  if (existingUser) {
    await prisma.user.delete({ where: { id: existingUser.id } }).catch(()=>{})
  }
  const existingContact = await prisma.contact.findFirst({ where: { organizationId: org.id, email } })
  if (existingContact) {
    await prisma.favorite.deleteMany({ where: { contactId: existingContact.id } })
    await prisma.contact.delete({ where: { id: existingContact.id } }).catch(()=>{})
  }

  const contact = await prisma.contact.create({
    data: {
      organizationId: org.id,
      kind: 'BUYER',
      name: 'Cliente Teste',
      email,
      phone: '41999999999',
    }
  })

  const user = await prisma.user.create({
    data: {
      organizationId: org.id,
      email,
      name: 'Cliente Teste',
      role: 'CLIENT',
      isActive: true,
      passHash: hashPassword(senha),
      contactId: contact.id,
    }
  })

  // cria 1 favorito se tiver imóvel
  const firstProperty = await prisma.property.findFirst({ where: { organizationId: org.id } })
  if (firstProperty) {
    await prisma.favorite.create({
      data: { contactId: contact.id, propertyId: firstProperty.id }
    })
    console.log(`Favorito criado: ${firstProperty.title}`)
  }

  console.log('\n✅ CLIENTE CRIADO!')
  console.log(`Email: ${email}`)
  console.log(`Senha: ${senha}`)
  console.log(`Login em: /login`)
  console.log(`Portal: /cliente/portal`)
  console.log(`Favoritos: /cliente/portal/favoritos`)
}

main().finally(()=>prisma.$disconnect())