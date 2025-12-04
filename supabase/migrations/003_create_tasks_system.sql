-- =====================================================
-- MARCOLA - Tasks & Templates System Migration
-- =====================================================
-- Cria as tabelas task_templates, tasks e client_notes
-- Inclui índices, RLS policies e triggers
-- =====================================================

-- =====================================================
-- TABELA: task_templates
-- Templates de tarefas por segmento/nicho
-- =====================================================

CREATE TABLE IF NOT EXISTS task_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(20) DEFAULT 'custom' CHECK (category IN ('operational', 'niche', 'custom')),
    segment VARCHAR(100),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    checklist JSONB DEFAULT '[]',
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    default_days_offset INTEGER DEFAULT 0,
    is_recurring BOOLEAN DEFAULT false,
    recurrence VARCHAR(20) CHECK (recurrence IN ('daily', 'every_3_days', 'weekly', 'biweekly', 'monthly')),
    notify_client BOOLEAN DEFAULT false,
    notify_message TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários da tabela
COMMENT ON TABLE task_templates IS 'Templates de tarefas por segmento/nicho';
COMMENT ON COLUMN task_templates.category IS 'Categoria: operational (48 tarefas padrão), niche (por segmento), custom (personalizado)';
COMMENT ON COLUMN task_templates.is_system IS 'Templates do sistema (não podem ser deletados)';
COMMENT ON COLUMN task_templates.priority IS 'Mapeado para default_priority no frontend';
COMMENT ON COLUMN task_templates.notify_client IS 'Mapeado para send_whatsapp no frontend';
COMMENT ON COLUMN task_templates.notify_message IS 'Mapeado para whatsapp_template no frontend';

-- =====================================================
-- TABELA: tasks
-- Tarefas vinculadas a clientes
-- =====================================================

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
    category VARCHAR(20) DEFAULT 'custom' CHECK (category IN ('operational', 'niche', 'custom')),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    checklist JSONB DEFAULT '[]',
    due_date DATE NOT NULL,
    due_time TIME,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done', 'cancelled')),
    is_recurring BOOLEAN DEFAULT false,
    recurrence VARCHAR(20) CHECK (recurrence IN ('daily', 'every_3_days', 'weekly', 'biweekly', 'monthly')),
    next_recurrence_date DATE,
    send_whatsapp BOOLEAN DEFAULT false,
    whatsapp_message TEXT,
    notified_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários da tabela
COMMENT ON TABLE tasks IS 'Tarefas vinculadas a clientes';
COMMENT ON COLUMN tasks.template_id IS 'Referência ao template original (se criada de template)';
COMMENT ON COLUMN tasks.next_recurrence_date IS 'Próxima data para tarefas recorrentes';

-- =====================================================
-- TABELA: client_notes
-- Notas de acompanhamento do cliente
-- =====================================================

CREATE TABLE IF NOT EXISTS client_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários da tabela
COMMENT ON TABLE client_notes IS 'Notas de acompanhamento do cliente';

-- =====================================================
-- ÍNDICES
-- =====================================================

-- task_templates indexes
CREATE INDEX IF NOT EXISTS idx_task_templates_user_id ON task_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);
CREATE INDEX IF NOT EXISTS idx_task_templates_segment ON task_templates(segment);
CREATE INDEX IF NOT EXISTS idx_task_templates_is_system ON task_templates(is_system);
CREATE INDEX IF NOT EXISTS idx_task_templates_is_active ON task_templates(is_active);

-- tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_template_id ON tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_is_recurring ON tasks(is_recurring);

-- client_notes indexes
CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_user_id ON client_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_is_pinned ON client_notes(is_pinned);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

-- task_templates policies
CREATE POLICY "Users can view their templates and system templates"
    ON task_templates FOR SELECT
    USING (auth.uid() = user_id OR is_system = true OR user_id IS NULL);

CREATE POLICY "Users can create their own templates"
    ON task_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
    ON task_templates FOR UPDATE
    USING (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can delete their own templates"
    ON task_templates FOR DELETE
    USING (auth.uid() = user_id AND is_system = false);

-- tasks policies
CREATE POLICY "Users can view their own tasks"
    ON tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create tasks for their clients"
    ON tasks FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM clients
            WHERE clients.id = tasks.client_id
            AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own tasks"
    ON tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
    ON tasks FOR DELETE
    USING (auth.uid() = user_id);

-- client_notes policies
CREATE POLICY "Users can view their own notes"
    ON client_notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create notes for their clients"
    ON client_notes FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM clients
            WHERE clients.id = client_notes.client_id
            AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own notes"
    ON client_notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
    ON client_notes FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para task_templates updated_at
CREATE TRIGGER update_task_templates_updated_at
    BEFORE UPDATE ON task_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tasks updated_at
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para client_notes updated_at
CREATE TRIGGER update_client_notes_updated_at
    BEFORE UPDATE ON client_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÃO: Criar próxima tarefa recorrente
-- =====================================================

CREATE OR REPLACE FUNCTION create_next_recurring_task()
RETURNS TRIGGER AS $$
DECLARE
    next_date DATE;
BEGIN
    -- Só processa se a tarefa foi concluída e é recorrente
    IF NEW.status = 'done' AND OLD.status != 'done' AND NEW.is_recurring = true AND NEW.recurrence IS NOT NULL THEN
        -- Calcula próxima data
        CASE NEW.recurrence
            WHEN 'daily' THEN next_date := NEW.due_date + INTERVAL '1 day';
            WHEN 'every_3_days' THEN next_date := NEW.due_date + INTERVAL '3 days';
            WHEN 'weekly' THEN next_date := NEW.due_date + INTERVAL '7 days';
            WHEN 'biweekly' THEN next_date := NEW.due_date + INTERVAL '14 days';
            WHEN 'monthly' THEN next_date := NEW.due_date + INTERVAL '1 month';
        END CASE;

        -- Cria nova tarefa
        INSERT INTO tasks (
            client_id, user_id, template_id, category, title, description,
            checklist, due_date, due_time, priority, status, is_recurring,
            recurrence, send_whatsapp, whatsapp_message
        ) VALUES (
            NEW.client_id, NEW.user_id, NEW.template_id, NEW.category, NEW.title, NEW.description,
            NEW.checklist, next_date, NEW.due_time, NEW.priority, 'todo', true,
            NEW.recurrence, NEW.send_whatsapp, NEW.whatsapp_message
        );

        -- Atualiza next_recurrence_date na tarefa original
        NEW.next_recurrence_date := next_date;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar próxima tarefa recorrente
CREATE TRIGGER trigger_create_recurring_task
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION create_next_recurring_task();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- Tabelas criadas: task_templates, tasks, client_notes
-- Índices criados para performance
-- RLS habilitado em todas as tabelas
-- Triggers configurados para updated_at e recorrência
