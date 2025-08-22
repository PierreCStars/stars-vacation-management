import { NextRequest, NextResponse } from 'next/server';
import { getVacationAnalytics } from '@/lib/vacation-analytics';
import { sendEmailWithFallbacks } from '@/lib/simple-email-service';

export async function GET(request: NextRequest) {
  try {
    // Get analytics for the current month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
    const endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
    
    const analytics = await getVacationAnalytics();
    
    // Filter for current month approved vacations
    const currentMonthVacations = analytics.byPerson.flatMap(person => 
      person.vacations.filter(vacation => {
        const vacationStart = new Date(vacation.startDate);
        const vacationEnd = new Date(vacation.endDate);
        const monthStart = new Date(startDate);
        const monthEnd = new Date(endDate);
        
        return vacationStart <= monthEnd && vacationEnd >= monthStart;
      })
    );
    
    if (currentMonthVacations.length === 0) {
      // Send notification that no vacations were granted
      const emailContent = `
        <h2>📅 Monthly Vacation Summary - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
        <p>No vacation requests were approved this month.</p>
        <p>All vacation requests are either pending, rejected, or scheduled for other months.</p>
      `;
      
      await sendEmailWithFallbacks(
        ['pierre@stars.mc', 'compta@stars.mc'],
        `📅 Monthly Vacation Summary - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        emailContent
      );
      
      return NextResponse.json({ 
        success: true, 
        count: 0, 
        message: 'No vacations granted this month' 
      });
    }
    
    // Create detailed summary
    const summaryByCompany = new Map<string, any[]>();
    const summaryByType = new Map<string, any[]>();
    
    currentMonthVacations.forEach(vacation => {
      // Group by company
      if (!summaryByCompany.has(vacation.company)) {
        summaryByCompany.set(vacation.company, []);
      }
      summaryByCompany.get(vacation.company)!.push(vacation);
      
      // Group by type
      if (!summaryByType.has(vacation.type)) {
        summaryByType.set(vacation.type, []);
      }
      summaryByType.get(vacation.type)!.push(vacation);
    });
    
    // Generate email content
    let emailContent = `
      <h2>📅 Monthly Vacation Summary - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
      <p><strong>Total Approved Vacations:</strong> ${currentMonthVacations.length}</p>
      
      <h3>🏢 By Company:</h3>
      <ul>
    `;
    
    summaryByCompany.forEach((vacations, company) => {
      const totalDays = vacations.reduce((sum, v) => sum + v.days, 0);
      emailContent += `<li><strong>${company}:</strong> ${vacations.length} vacations, ${totalDays} total days</li>`;
    });
    
    emailContent += `
      </ul>
      
      <h3>🏖️ By Type:</h3>
      <ul>
    `;
    
    summaryByType.forEach((vacations, type) => {
      const totalDays = vacations.reduce((sum, v) => sum + v.days, 0);
      emailContent += `<li><strong>${type}:</strong> ${vacations.length} vacations, ${totalDays} total days</li>`;
    });
    
    emailContent += `
      </ul>
      
      <h3>👥 Detailed List:</h3>
      <table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;">
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px;">Employee</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Company</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Type</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Start Date</th>
          <th style="border: 1px solid #ddd; padding: 8px;">End Date</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Days</th>
        </tr>
    `;
    
    currentMonthVacations.forEach(vacation => {
      const person = analytics.byPerson.find(p => 
        p.vacations.some(v => v.id === vacation.id)
      );
      
      emailContent += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${person?.userName || 'Unknown'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${vacation.company}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${vacation.type}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${new Date(vacation.startDate).toLocaleDateString()}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${new Date(vacation.endDate).toLocaleDateString()}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${vacation.days}</td>
        </tr>
      `;
    });
    
    emailContent += `
      </table>
      
      <p><em>This summary was automatically generated on ${new Date().toLocaleString()}</em></p>
    `;
    
    // Send email to admins
    await sendEmailWithFallbacks(
      ['pierre@stars.mc', 'compta@stars.mc'],
      `📅 Monthly Vacation Summary - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      emailContent
    );
    
    return NextResponse.json({ 
      success: true, 
      count: currentMonthVacations.length,
      message: `Monthly vacation summary sent successfully. Found ${currentMonthVacations.length} approved vacations.`
    });
    
  } catch (error) {
    console.error('Error sending monthly vacation summary:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
