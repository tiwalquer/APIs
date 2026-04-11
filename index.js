
// index.js
const express = require('express');
const db = require('./Database');  // ← Importar!

const app = express();
app.use(express.json());
// Agora podemos usar 'db' nas rotas!

//const db = new Database('produtos.db');



app.listen(3001, () => console.log('🚀 API na porta 3001'));


/// POST /api/produtos - Criar produto
app.post('/api/produtos', (req, res) => { //essa é a minha rota
    try {
        // 1. Pegar dados do body
        const { nome, preco, categoria, estoque = 0 } = req.body;
        
        // 2. Validações (igual antes!)
        if (!nome || !preco || !categoria) {
            return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
        }
        
        if (typeof preco !== 'number' || preco <= 0) {
            return res.status(400).json({  erro: 'Preço inválido' });
        }
        
        // 3. Preparar INSERT
        const stmt = db.prepare(`
            INSERT INTO produtos (nome, preco, categoria, estoque)
            VALUES (?, ?, ?, ?)
        `);
        
        // 4. Executar INSERT
        const result = stmt.run(nome, preco, categoria, estoque);
        
        // 5. Pegar ID gerado
        const id = result.lastInsertRowid;
        
        // 6. Buscar produto criado (para retornar completo)
        const produtoCriado = db.prepare(
            'SELECT * FROM produtos WHERE id = ?'
        ).get(id);
        
        // 7. Retornar 201 Created
        res.status(201).json(produtoCriado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao criar produto' });
    }
});





// GET /api/produtos - Listar todos
app.get('/api/produtos', (req, res) => {
    try {
        // Preparar query
        const stmt = db.prepare('SELECT * FROM produtos');
        
        // Executar e pegar todos os resultados
        const produtos = stmt.all();
        
        // Retornar array (pode ser vazio [])
        res.json(produtos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar produtos' });
    }
});

// PUT /api/produtos/:id - Atualizar produto
app.put('/api/produtos/:id', (req, res) => {
    try {
        // 1. Pegar ID da URL
        const id = parseInt(req.params.id);
        
        // 2. Verificar se produto existe
        const produtoExiste = db.prepare(
            'SELECT * FROM produtos WHERE id = ?'
        ).get(id);
        
        if (!produtoExiste) {
            return res.status(404).json({ 
                erro: 'Produto não encontrado' 
            });
        }
        
        // 3. Pegar dados do body
        const { nome, preco, categoria, estoque } = req.body;
        
        // 4. Validações (mesmas do POST!)
        if (!nome || !preco || !categoria) {
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
            UPDATE produtos 
            SET nome = ?, preco = ?, categoria = ?, estoque = ?
            WHERE id = ?
        `);
        
        stmt.run(nome, preco, categoria, estoque || 0, id);
        
        // 6. Buscar produto atualizado
        const produtoAtualizado = db.prepare(
            'SELECT * FROM produtos WHERE id = ?'
        ).get(id);
        
        // 7. Retornar 200 OK
        res.json(produtoAtualizado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao atualizar' });
    }
});

// DELETE /api/produtos/:id - Deletar produto
app.delete('/api/produtos/:id', (req, res) => {
    try {
        // 1. Pegar ID da URL
        const id = parseInt(req.params.id);
        
        // 2. Verificar se produto existe
        const produtoExiste = db.prepare(
            'SELECT * FROM produtos WHERE id = ?'
        ).get(id);
        
        if (!produtoExiste) {
            return res.status(404).json({ 
                erro: 'Produto não encontrado' 
            });
        }
        
        // 3. Executar DELETE
        const stmt = db.prepare('DELETE FROM produtos WHERE id = ?');
        stmt.run(id);
        
        // 4. Retornar 204 No Content
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao deletar' });
    }
});

