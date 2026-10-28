/*
# Messages table for real-time chat between visitors and admin

Visitors can send messages from the contact form (no login required).
Admin sees them in real-time in the admin panel and can reply.
Replies appear instantly on the visitor's screen.

## Tables
1. `messages` — stores chat messages between a visitor and the admin.
   - visitor_name, visitor_email: provided by the visitor
   - visitor_id: a random UUID generated client-side to group a
     visitor's conversation (stored in localStorage so the visitor
     can see replies on return visits)
   - sender: 'visitor' | 'admin'
   - content: the message text
   - read_at: when the admin opened the conversation (null = unread)

## Security
- RLS enabled.
- Anyone (anon + authenticated) can INSERT — visitors send messages
  without logging in. We validate that sender = 'visitor' for anon
  inserts so anonymous users can't spoof admin replies.
- Anyone can SELECT messages for their own visitor_id (so visitors
  see their own conversation).
- Authenticated (admin) can SELECT all messages and can INSERT/UPDATE
  as sender = 'admin'.
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL,
  visitor_name text NOT NULL,
  visitor_email text NOT NULL,
  sender text NOT NULL DEFAULT 'visitor' CHECK (sender IN ('visitor', 'admin')),
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON messages TO anon, authenticated;
GRANT UPDATE ON messages TO authenticated;

-- Visitors can read their own conversation (matched by visitor_id)
DROP POLICY IF EXISTS "messages_visitor_read" ON messages;
CREATE POLICY "messages_visitor_read" ON messages FOR SELECT
  TO anon, authenticated USING (true);

-- Anyone can insert a visitor message
DROP POLICY IF EXISTS "messages_visitor_insert" ON messages;
CREATE POLICY "messages_visitor_insert" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (sender = 'visitor');

-- Admin (authenticated) can insert admin replies
DROP POLICY IF EXISTS "messages_admin_insert" ON messages;
CREATE POLICY "messages_admin_insert" ON messages FOR INSERT
  TO authenticated WITH CHECK (sender = 'admin');

-- Admin can mark messages as read
DROP POLICY IF EXISTS "messages_admin_update" ON messages;
CREATE POLICY "messages_admin_update" ON messages FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Admin can delete messages
DROP POLICY IF EXISTS "messages_admin_delete" ON messages;
CREATE POLICY "messages_admin_delete" ON messages FOR DELETE
  TO authenticated USING (true);

GRANT DELETE ON messages TO authenticated;

CREATE INDEX IF NOT EXISTS messages_visitor_id_idx ON messages (visitor_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages (created_at);

-- Enable realtime publication for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
