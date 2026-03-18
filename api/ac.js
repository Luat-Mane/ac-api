export default async function handler(req, res) {
    console.log("🔥 HIT API", req.body)

    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    if (req.method === "OPTIONS") {
        return res.status(200).end()
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    try {
        const {
            email,
            firstName,
            lastName,
            phone,
            listId,
            tagName,
            apiUrl,
            apiKey,
        } = req.body

        if (!email || !apiUrl || !apiKey) {
            return res.status(400).json({ error: "Missing required fields" })
        }

        const baseUrl = apiUrl.replace(/\/$/, "")

        // 🔥 1. Tạo / update contact
        const contactRes = await fetch(`${baseUrl}/api/3/contact/sync`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Api-Token": apiKey,
            },
            body: JSON.stringify({
                contact: {
                    email,
                    firstName,
                    lastName,
                    phone,
                },
            }),
        })

        const contactData = await contactRes.json()
        console.log("👤 Contact:", contactData)

        const contactId = contactData?.contact?.id

        if (!contactId) {
            return res.status(500).json({ error: "Cannot create contact" })
        }

        // 🔥 2. Add vào list
        if (listId) {
            await fetch(`${baseUrl}/api/3/contactLists`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Api-Token": apiKey,
                },
                body: JSON.stringify({
                    contactList: {
                        list: listId,
                        contact: contactId,
                        status: 1,
                    },
                }),
            })
        }

        // 🔥 3. Add tag (optional)
        if (tagName) {
            // tìm tag
            const tagRes = await fetch(
                `${baseUrl}/api/3/tags?search=${encodeURIComponent(tagName)}`,
                {
                    headers: {
                        "Api-Token": apiKey,
                    },
                }
            )

            const tagData = await tagRes.json()
            const tagId = tagData?.tags?.[0]?.id

            if (tagId) {
                await fetch(`${baseUrl}/api/3/contactTags`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Api-Token": apiKey,
                    },
                    body: JSON.stringify({
                        contactTag: {
                            contact: contactId,
                            tag: tagId,
                        },
                    }),
                })
            }
        }

        return res.status(200).json({ success: true })
    } catch (err) {
        console.error("❌ ERROR:", err)
        return res.status(500).json({ error: "Server error" })
    }
}
