const { Client } = require('pg');
const readline = require('readline');

// Database configuration
const dbConfig = {
  host: '31.97.187.91',
  port: 5432,
  database: 'eacon',
  user: 'eacon',
  password: 'eacon@123',
  ssl: false // Set to true if SSL is required
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class TemplateQualityChecker {
  constructor() {
    this.client = new Client(dbConfig);
  }

  async connect() {
    try {
      await this.client.connect();
      console.log(`${colors.green}✅ Connected to PostgreSQL database successfully${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}❌ Database connection failed:${colors.reset}`, error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    await this.client.end();
    console.log(`${colors.yellow}📤 Disconnected from database${colors.reset}`);
  }

  // Get all transform templates
  async getTransformTemplates() {
    const query = `
      SELECT 
        id, 
        title, 
        description, 
        prompt, 
        "hiddenPrompt",
        tags, 
        cost, 
        "unlockCost",
        "requiresUpload",
        type,
        "createdAt",
        "updatedAt"
      FROM "Template" 
      WHERE type = 'transform' 
      ORDER BY "createdAt" DESC
    `;
    
    try {
      const result = await this.client.query(query);
      return result.rows;
    } catch (error) {
      console.error(`${colors.red}❌ Error fetching templates:${colors.reset}`, error.message);
      return [];
    }
  }

  // Analyze template quality
  analyzeTemplateQuality(template) {
    const issues = [];
    const suggestions = [];
    let score = 100;

    // Check prompt length and detail
    if (!template.prompt || template.prompt.length < 50) {
      issues.push('Prompt quá ngắn (< 50 ký tự)');
      suggestions.push('Thêm chi tiết mô tả về style, color, mood');
      score -= 20;
    }

    if (!template.hiddenPrompt || template.hiddenPrompt.length < 100) {
      issues.push('Hidden prompt quá ngắn hoặc thiếu');
      suggestions.push('Thêm technical details, parameters cho AI');
      score -= 25;
    }

    // Check for keywords that improve AI generation
    const goodKeywords = [
      'high quality', 'detailed', 'professional', 'cinematic', 'artistic',
      'vibrant', 'dramatic', 'lighting', 'composition', 'style', 'mood',
      'color palette', 'texture', 'atmosphere', 'aesthetic'
    ];

    const fullText = `${template.prompt} ${template.hiddenPrompt}`.toLowerCase();
    const foundKeywords = goodKeywords.filter(keyword => fullText.includes(keyword));
    
    if (foundKeywords.length < 3) {
      issues.push(`Thiếu keywords chất lượng (chỉ có ${foundKeywords.length}/14)`);
      suggestions.push('Thêm keywords: high quality, detailed, professional, cinematic');
      score -= 15;
    }

    // Check for specific transform styles
    const transformStyles = [
      'vintage', 'modern', 'artistic', 'photographic', 'digital art',
      'watercolor', 'oil painting', 'sketch', 'cartoon', 'anime'
    ];

    const hasStyle = transformStyles.some(style => fullText.includes(style));
    if (!hasStyle) {
      issues.push('Không chỉ định style cụ thể');
      suggestions.push('Thêm style rõ ràng như vintage, artistic, photographic');
      score -= 10;
    }

    // Check technical parameters
    const techParams = [
      'aspect ratio', 'resolution', 'color grading', 'contrast',
      'saturation', 'brightness', 'depth of field', 'bokeh'
    ];

    const hasTechParams = techParams.some(param => fullText.includes(param));
    if (!hasTechParams) {
      issues.push('Thiếu technical parameters');
      suggestions.push('Thêm: aspect ratio, color grading, lighting setup');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
      grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D'
    };
  }

  // Display template analysis
  displayTemplate(template, index) {
    const analysis = this.analyzeTemplateQuality(template);
    const gradeColor = {
      'A': colors.green,
      'B': colors.cyan,
      'C': colors.yellow,
      'D': colors.red
    }[analysis.grade];

    console.log(`\n${colors.bright}=== Template #${index + 1}: ${template.title} ===${colors.reset}`);
    console.log(`${colors.blue}ID:${colors.reset} ${template.id}`);
    console.log(`${colors.blue}Type:${colors.reset} ${template.type}`);
    console.log(`${colors.blue}Cost:${colors.reset} ${template.cost} tokens`);
    console.log(`${colors.blue}Unlock Cost:${colors.reset} ${template.unlockCost} tokens`);
    console.log(`${colors.blue}Requires Upload:${colors.reset} ${template.requiresUpload}`);
    
    console.log(`\n${colors.blue}Quality Score:${colors.reset} ${gradeColor}${analysis.score}/100 (Grade: ${analysis.grade})${colors.reset}`);
    
    console.log(`\n${colors.blue}Current Prompt:${colors.reset}`);
    console.log(`${colors.cyan}${template.prompt || 'N/A'}${colors.reset}`);
    
    console.log(`\n${colors.blue}Hidden Prompt:${colors.reset}`);
    console.log(`${colors.cyan}${template.hiddenPrompt || 'N/A'}${colors.reset}`);

    if (analysis.issues.length > 0) {
      console.log(`\n${colors.red}⚠️  Issues:${colors.reset}`);
      analysis.issues.forEach(issue => console.log(`  • ${issue}`));
    }

    if (analysis.suggestions.length > 0) {
      console.log(`\n${colors.green}💡 Suggestions:${colors.reset}`);
      analysis.suggestions.forEach(suggestion => console.log(`  • ${suggestion}`));
    }

    console.log(`\n${colors.blue}Tags:${colors.reset} ${template.tags?.join(', ') || 'None'}`);
    console.log(`${colors.blue}Created:${colors.reset} ${new Date(template.createdAt).toLocaleString()}`);
  }

  // Generate improved prompt suggestions
  generateImprovedPrompt(template) {
    const currentPrompt = template.prompt || '';
    const currentHidden = template.hiddenPrompt || '';
    
    // Improved prompt suggestions based on template style
    const baseImprovements = [
      'high quality, professional',
      'detailed and realistic',
      'perfect composition',
      'cinematic lighting'
    ];

    const styleSpecific = {
      vintage: 'vintage aesthetic, retro colors, aged texture, nostalgic mood, film grain',
      artistic: 'artistic interpretation, creative expression, vibrant colors, dynamic composition',
      colorful: 'vibrant color palette, rich saturation, rainbow hues, color harmony',
      modern: 'contemporary style, clean lines, minimalist approach, modern aesthetic',
      dramatic: 'dramatic lighting, high contrast, emotional impact, powerful composition'
    };

    // Detect style from title/description
    let detectedStyle = 'artistic'; // default
    Object.keys(styleSpecific).forEach(style => {
      if (template.title.toLowerCase().includes(style) || 
          template.description.toLowerCase().includes(style)) {
        detectedStyle = style;
      }
    });

    const improvedPrompt = `${currentPrompt}, ${baseImprovements.join(', ')}, ${styleSpecific[detectedStyle]}`;
    
    const improvedHidden = `${currentHidden}${currentHidden ? ', ' : ''}highly detailed, 8k resolution, professional photography, perfect lighting, sharp focus, color grading, depth of field, realistic textures, award-winning composition`;

    return {
      prompt: improvedPrompt,
      hiddenPrompt: improvedHidden,
      detectedStyle
    };
  }

  // Update template in database
  async updateTemplate(templateId, updates) {
    const query = `
      UPDATE "Template" 
      SET 
        prompt = $2,
        "hiddenPrompt" = $3,
        "updatedAt" = NOW()
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await this.client.query(query, [
        templateId,
        updates.prompt,
        updates.hiddenPrompt
      ]);
      
      if (result.rows.length > 0) {
        console.log(`${colors.green}✅ Template updated successfully${colors.reset}`);
        return result.rows[0];
      } else {
        console.log(`${colors.red}❌ Template not found${colors.reset}`);
        return null;
      }
    } catch (error) {
      console.error(`${colors.red}❌ Error updating template:${colors.reset}`, error.message);
      return null;
    }
  }

  // Interactive menu
  async showMenu() {
    console.log(`\n${colors.bright}${colors.cyan}🎨 Template Quality Checker Menu${colors.reset}`);
    console.log(`${colors.yellow}1.${colors.reset} View all transform templates`);
    console.log(`${colors.yellow}2.${colors.reset} Analyze specific template by ID`);
    console.log(`${colors.yellow}3.${colors.reset} Auto-improve all templates`);
    console.log(`${colors.yellow}4.${colors.reset} Update specific template`);
    console.log(`${colors.yellow}5.${colors.reset} Generate quality report`);
    console.log(`${colors.yellow}6.${colors.reset} Exit`);
    
    return new Promise((resolve) => {
      rl.question('\n📋 Enter your choice (1-6): ', (answer) => {
        resolve(answer.trim());
      });
    });
  }

  // Main execution flow
  async run() {
    console.log(`${colors.bright}${colors.blue}🚀 Template Quality Checker Started${colors.reset}\n`);
    
    await this.connect();
    
    let running = true;
    while (running) {
      const choice = await this.showMenu();
      
      switch (choice) {
        case '1':
          await this.viewAllTemplates();
          break;
        case '2':
          await this.analyzeSpecificTemplate();
          break;
        case '3':
          await this.autoImproveAllTemplates();
          break;
        case '4':
          await this.updateSpecificTemplate();
          break;
        case '5':
          await this.generateQualityReport();
          break;
        case '6':
          running = false;
          break;
        default:
          console.log(`${colors.red}❌ Invalid choice. Please try again.${colors.reset}`);
      }
    }
    
    await this.disconnect();
    rl.close();
  }

  async viewAllTemplates() {
    console.log(`\n${colors.cyan}📋 Loading all transform templates...${colors.reset}`);
    const templates = await this.getTransformTemplates();
    
    if (templates.length === 0) {
      console.log(`${colors.yellow}⚠️  No transform templates found${colors.reset}`);
      return;
    }

    templates.forEach((template, index) => {
      this.displayTemplate(template, index);
    });

    console.log(`\n${colors.green}📊 Total templates: ${templates.length}${colors.reset}`);
  }

  async analyzeSpecificTemplate() {
    const id = await new Promise((resolve) => {
      rl.question('\n🔍 Enter template ID to analyze: ', resolve);
    });

    const query = 'SELECT * FROM "Template" WHERE id = $1 AND type = $2';
    try {
      const result = await this.client.query(query, [id, 'transform']);
      if (result.rows.length > 0) {
        this.displayTemplate(result.rows[0], 0);
        
        const improved = this.generateImprovedPrompt(result.rows[0]);
        console.log(`\n${colors.green}💡 Suggested Improvements:${colors.reset}`);
        console.log(`${colors.blue}Improved Prompt:${colors.reset}`);
        console.log(`${colors.cyan}${improved.prompt}${colors.reset}`);
        console.log(`${colors.blue}Improved Hidden Prompt:${colors.reset}`);
        console.log(`${colors.cyan}${improved.hiddenPrompt}${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ Template not found${colors.reset}`);
      }
    } catch (error) {
      console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
    }
  }

  async autoImproveAllTemplates() {
    console.log(`\n${colors.cyan}🔄 Auto-improving all transform templates...${colors.reset}`);
    const templates = await this.getTransformTemplates();
    
    const confirm = await new Promise((resolve) => {
      rl.question(`\n⚠️  This will update ${templates.length} templates. Continue? (y/N): `, resolve);
    });

    if (confirm.toLowerCase() !== 'y') {
      console.log(`${colors.yellow}⏹️  Operation cancelled${colors.reset}`);
      return;
    }

    let updated = 0;
    for (const template of templates) {
      const analysis = this.analyzeTemplateQuality(template);
      if (analysis.score < 70) {
        const improved = this.generateImprovedPrompt(template);
        const result = await this.updateTemplate(template.id, improved);
        if (result) {
          updated++;
          console.log(`✅ Updated: ${template.title} (Score: ${analysis.score} → estimated 85+)`);
        }
      }
    }

    console.log(`\n${colors.green}🎉 Auto-improvement completed! Updated ${updated} templates${colors.reset}`);
  }

  async updateSpecificTemplate() {
    const id = await new Promise((resolve) => {
      rl.question('\n✏️  Enter template ID to update: ', resolve);
    });

    // First, show current template
    const query = 'SELECT * FROM "Template" WHERE id = $1 AND type = $2';
    try {
      const result = await this.client.query(query, [id, 'transform']);
      if (result.rows.length === 0) {
        console.log(`${colors.red}❌ Template not found${colors.reset}`);
        return;
      }

      const template = result.rows[0];
      this.displayTemplate(template, 0);

      // Get new values
      const newPrompt = await new Promise((resolve) => {
        rl.question(`\n📝 Enter new prompt (current: ${template.prompt?.substring(0, 50)}...): `, resolve);
      });

      const newHiddenPrompt = await new Promise((resolve) => {
        rl.question(`\n🔒 Enter new hidden prompt (current: ${template.hiddenPrompt?.substring(0, 50)}...): `, resolve);
      });

      if (newPrompt.trim() || newHiddenPrompt.trim()) {
        const updates = {
          prompt: newPrompt.trim() || template.prompt,
          hiddenPrompt: newHiddenPrompt.trim() || template.hiddenPrompt
        };

        await this.updateTemplate(template.id, updates);
      } else {
        console.log(`${colors.yellow}⏹️  No changes made${colors.reset}`);
      }
    } catch (error) {
      console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
    }
  }

  async generateQualityReport() {
    console.log(`\n${colors.cyan}📊 Generating quality report...${colors.reset}`);
    const templates = await this.getTransformTemplates();
    
    if (templates.length === 0) {
      console.log(`${colors.yellow}⚠️  No templates to analyze${colors.reset}`);
      return;
    }

    const report = {
      total: templates.length,
      grades: { A: 0, B: 0, C: 0, D: 0 },
      avgScore: 0,
      needsImprovement: []
    };

    let totalScore = 0;

    templates.forEach(template => {
      const analysis = this.analyzeTemplateQuality(template);
      report.grades[analysis.grade]++;
      totalScore += analysis.score;
      
      if (analysis.score < 70) {
        report.needsImprovement.push({
          id: template.id,
          title: template.title,
          score: analysis.score,
          issues: analysis.issues
        });
      }
    });

    report.avgScore = Math.round(totalScore / templates.length);

    // Display report
    console.log(`\n${colors.bright}📈 QUALITY REPORT${colors.reset}`);
    console.log(`${colors.blue}Total Templates:${colors.reset} ${report.total}`);
    console.log(`${colors.blue}Average Score:${colors.reset} ${report.avgScore}/100`);
    console.log(`\n${colors.blue}Grade Distribution:${colors.reset}`);
    console.log(`  ${colors.green}A (80-100):${colors.reset} ${report.grades.A} templates`);
    console.log(`  ${colors.cyan}B (60-79):${colors.reset} ${report.grades.B} templates`);
    console.log(`  ${colors.yellow}C (40-59):${colors.reset} ${report.grades.C} templates`);
    console.log(`  ${colors.red}D (0-39):${colors.reset} ${report.grades.D} templates`);

    if (report.needsImprovement.length > 0) {
      console.log(`\n${colors.red}⚠️  Templates needing improvement (${report.needsImprovement.length}):${colors.reset}`);
      report.needsImprovement.forEach(item => {
        console.log(`  • ${item.title} (ID: ${item.id}, Score: ${item.score})`);
      });
    }

    console.log(`\n${colors.green}💡 Recommendation:${colors.reset}`);
    if (report.avgScore >= 80) {
      console.log(`Excellent! Most templates are high quality.`);
    } else if (report.avgScore >= 60) {
      console.log(`Good overall quality, but consider improving lower-scoring templates.`);
    } else {
      console.log(`Significant improvements needed. Consider running auto-improvement.`);
    }
  }
}

// Run the script
if (require.main === module) {
  const checker = new TemplateQualityChecker();
  checker.run().catch(error => {
    console.error(`${colors.red}💥 Fatal error:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = TemplateQualityChecker; 