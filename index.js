
// index.js
const express = require('express');
const db = require('./Database');  // ← Importar!

const app = express();
app.use(express.json());
// Agora podemos usar 'db' nas rotas!

//const db = new Database('locadoraTiagao.db');



app.listen(3001, () => console.log('🚀 API na porta 3001'));


/// POST /api/locadoraTiagao - Criar filme
app.post('/api/locadoraTiagao', (req, res) => { //essa é a minha rota/URL
    try {
        // 1. Pegar dados do body
        const { nome, preco, genero, estoque = 0 } = req.body;
        
        // 2. Validações (igual antes!)
        if (!nome || !preco || !genero) {
            return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
        }
        
        if (typeof preco !== 'number' || preco <= 0) {
            return res.status(400).json({  erro: 'Preço inválido' });
        }
        
        // 3. Preparar INSERT
        const stmt = db.prepare(`
            INSERT INTO locadoraTiagao (nome, preco, genero, estoque)
            VALUES (?, ?, ?, ?)
        `);
        
        // 4. Executar INSERT
        const result = stmt.run(nome, preco, genero, estoque);
        
        // 5. Pegar ID gerado
        const id = result.lastInsertRowid;
        
        // 6. Buscar filme criado (para retornar completo)
        const filmeCriado = db.prepare(
            'SELECT * FROM locadoraTiagao WHERE id = ?'
        ).get(id);
        
        // 7. Retornar 201 Created
        res.status(201).json(filmeCriado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao criar filme' });
    }
});





// GET /api/locadoraTiagao - Listar todos
app.get('/api/locadoraTiagao', (req, res) => {
    try {
        // Preparar query
        const stmt = db.prepare('SELECT * FROM locadoraTiagao');
        
        // Executar e pegar todos os resultados
        const locadoraTiagao = stmt.all();
        
        // Retornar array (pode ser vazio [])
        res.json(locadoraTiagao);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar locadoraTiagao' });
    }
});

// PUT /api/locadoraTiagao/:id - Atualizar filme
app.put('/api/locadoraTiagao/:id', (req, res) => {
    try {
        // 1. Pegar ID da URL
        const id = parseInt(req.params.id);
        
        // 2. Verificar se filme existe
        const filmeExiste = db.prepare(
            'SELECT * FROM locadoraTiagao WHERE id = ?'
        ).get(id);
        
        if (!filmeExiste) {
            return res.status(404).json({ 
                erro: 'filme não encontrado' 
            });
        }
        
        // 3. Pegar dados do body
        const { nome, preco, genero, estoque } = req.body;
        
        // 4. Validações (mesmas do POST!)
        if (!nome || !preco || !genero) {
            return res.status(400).json({ 
                erro: 'Campos obrigatórios faltando' 
            });
        }
        
        if (typeof preco !== 'number' || preco <= 0) {
            return res.status(400).json({ 
                erro: 'Preço inválido' 
            });
        }
        
        // 5. Executar UPDATE
        const stmt = db.prepare(`
            UPDATE locadoraTiagao 
            SET nome = ?, preco = ?, genero = ?, estoque = ?
            WHERE id = ?
        `);
        
        stmt.run(nome, preco, genero, estoque || 0, id);
        
        // 6. Buscar filme atualizado
        const filmeAtualizado = db.prepare(
            'SELECT * FROM locadoraTiagao WHERE id = ?'
        ).get(id);
        
        // 7. Retornar 200 OK
        res.json(filmeAtualizado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao atualizar' });
    }
});

// DELETE /api/locadoraTiagao/:id - Deletar filme
app.delete('/api/locadoraTiagao/:id', (req, res) => {
    try {
        // 1. Pegar ID da URL
        const id = parseInt(req.params.id);
        
        // 2. Verificar se filme existe
        const filmeExiste = db.prepare(
            'SELECT * FROM locadoraTiagao WHERE id = ?'
        ).get(id);
        
        if (!filmeExiste) {
            return res.status(404).json({ 
                erro: 'filme não encontrado' 
            });
        }
        
        // 3. Executar DELETE
        const stmt = db.prepare('DELETE FROM locadoraTiagao WHERE id = ?');
        stmt.run(id);
        
        // 4. Retornar 204 No Content
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao deletar' });
    }
});

