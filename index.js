
// index.js
const express = require('express');
const db = require('./Database');  // ← Importar!

const app = express();
app.use(express.json());
// Agora podemos usar 'db' nas rotas!

app.listen(3001, () => console.log('🚀 API na porta 3001'));


/// POST /api/locadoraTiagao - Criar filme
app.post('/api/locadoraTiagao', (req, res) => { //essa é a minha rota/URL
    try {
        // 1. Pegar dados do body
        const { nome, preco, genero, estoque = 0 } = req.body;
        
        // 2. Validações
        if (!nome || !preco || !genero) { //tem que ter valor
            return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
        }
        
        if (typeof preco !== 'number' || preco <= 0) {
            return res.status(400).json({  erro: 'Preço inválido' });
        }
        
        if(typeof estoque !== 'number' || estoque < 0){
            return res.status(400).json({ erro: 'quantidade invalida' });
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


app.get('/api/locadoraTiagao', async (req, res) => {
    try {
        const queryData = buildQuery(req.query);

        const total = await getTotal(queryData);
        const produtos = await getProdutos(queryData, req.query);

        const response = buildResponse(produtos, total, req.query);

        res.json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro na busca' });
    }
});

function buildQuery(query) {
    let sql = 'SELECT * FROM locadoraTiagao WHERE 1=1';
    const params = [];

    // Filtro por gênero
    if (query.genero) {
        sql += ` AND (
            genero = ?
            OR genero LIKE ?
            OR genero LIKE ?
            OR genero LIKE ?
        )`;

        params.push(query.genero);
        params.push(`${query.genero}/%`);
        params.push(`%/${query.genero}`);
        params.push(`%/${query.genero}/%`);
    }

    // Filtro por preço
    if (query.preco_max) {
        sql += ' AND preco <= ?';
        params.push(parseFloat(query.preco_max));
    }

    if (query.preco_min) {
        sql += ' AND preco >= ?';
        params.push(parseFloat(query.preco_min));
    }

    // ORDER BY 
    if (query.ordem) {
        const camposValidos = ['nome', 'preco', 'genero', 'created_at'];

        if (camposValidos.includes(query.ordem)) {
            sql += ` ORDER BY ${query.ordem}`;

            if (query.direcao === 'desc') {
                sql += ' DESC';
            } else {
                sql += ' ASC';
            }
        }
    }

    return { sql, params };
}

async function getTotal({ sql, params }) {
    const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
    const row = db.prepare(countSql).get(...params);
    return row.total;
}

async function getProdutos({ sql, params }, query = {}) {
    let finalSql = sql;
    const finalParams = [...params];

    const limite = parseInt(query.limite) || null;
    const pagina = parseInt(query.pagina) || 1;

    if (limite) {
        const offset = (pagina - 1) * limite;
        finalSql += ' LIMIT ? OFFSET ?';
        finalParams.push(limite, offset);
    }

    return db.prepare(finalSql).all(...finalParams);
}

function buildResponse(produtos, total, query) {
    if (!query.limite) {
        return produtos;
    }

    const limite = parseInt(query.limite);
    const pagina = parseInt(query.pagina) || 1;

    return {
        dados: produtos,
        paginacao: {
            pagina_atual: pagina,
            itens_por_pagina: limite,
            total_itens: total,
            total_paginas: Math.ceil(total / limite)
        }
    };
}


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
        
        if(typeof estoque !== 'number' || estoque < 0){
            return res.status(400).json({ erro: 'quantidade invalida' });
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

