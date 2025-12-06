-- =====================================================
-- MARCOLA - Assistant Tables Migration
-- =====================================================
-- Cria as tabelas meetings e reminders para o MARCOLA Assistant
-- Inclui índices, RLS policies e triggers
-- =====================================================

-- =====================================================
-- TABELA: meetings
-- Reuniões agendadas com clientes
-- =====================================================

CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type VARCHAR(20) DEFAULT 'online' CHECK (type IN ('online', 'presencial')),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
    location TEXT,
    meeting_link TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários da tabela
COMMENT ON TABLE meetings IS 'Reuniões agendadas com clientes';
COMMENT ON COLUMN meetings.type IS 'Tipo: online ou presencial';
COMMENT ON COLUMN meetings.status IS 'Status: scheduled, confirmed, completed, cancelled, rescheduled';
COMMENT ON COLUMN meetings.meeting_link IS 'Link para reunião online (Google Meet, Zoom, etc)';
COMMENT ON COLUMN meetings.reminder_sent IS 'Se o lembrete já foi enviado';

-- =====================================================
-- TABELA: reminders
-- Lembretes pessoais do usuário
-- =====================================================

CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(20) DEFAULT 'personal' CHECK (type IN ('personal', 'payment', 'meeting', 'task', 'followup')),
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    recurrence VARCHAR(20) CHECK (recurrence IN ('daily', 'weekly', 'monthly', 'none')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários da tabela
COMMENT ON TABLE reminders IS 'Lembretes pessoais do usuário';
COMMENT ON COLUMN reminders.client_id IS 'Cliente relacionado (opcional)';
COMMENT ON COLUMN reminders.type IS 'Tipo: personal, payment, meeting, task, followup';
COMMENT ON COLUMN reminders.is_sent IS 'Se o lembrete já foi disparado';
COMMENT ON COLUMN reminders.recurrence IS 'Recorrência do lembrete';

-- =====================================================
-- ÍNDICES
-- =====================================================

-- meetings indexes
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_client_id ON meetings(client_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_user_date ON meetings(user_id, date);

-- reminders indexes
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_client_id ON reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_is_sent ON reminders(is_sent);
CREATE INDEX IF NOT EXISTS idx_reminders_user_remind_at ON reminders(user_id, remind_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- meetings policies
CREATE POLICY "Users can view their own meetings"
    ON meetings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create meetings for their clients"
    ON meetings FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM clients
            WHERE clients.id = meetings.client_id
            AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own meetings"
    ON meetings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetings"
    ON meetings FOR DELETE
    USING (auth.uid() = user_id);

-- reminders policies
CREATE POLICY "Users can view their own reminders"
    ON reminders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
    ON reminders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
    ON reminders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
    ON reminders FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para meetings updated_at
CREATE TRIGGER update_meetings_updated_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para reminders updated_at
CREATE TRIGGER update_reminders_updated_at
    BEFORE UPDATE ON reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- Tabelas criadas: meetings, reminders
-- Índices criados para performance
-- RLS habilitado em todas as tabelas
-- Triggers configurados para updated_at
