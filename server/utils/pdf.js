import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Generate invoice PDF
export const generateInvoicePDF = async (order, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      // Header
      doc.fontSize(20).text('INVOICE', 50, 50);
      doc.fontSize(12).text(`Invoice #: ${order.orderNumber}`, 50, 80);
      doc.text(`Date: ${order.createdAt.toLocaleDateString()}`, 50, 95);

      // Company info
      doc.text('E-Shop', 400, 50);
      doc.text('123 Business Street', 400, 65);
      doc.text('City, State 12345', 400, 80);
      doc.text('Phone: (555) 123-4567', 400, 95);

      // Customer info
      doc.text('Bill To:', 50, 130);
      doc.text(`${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`, 50, 145);
      doc.text(order.shippingAddress.address, 50, 160);
      doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`, 50, 175);

      // Items table header
      const tableTop = 220;
      doc.text('Item', 50, tableTop);
      doc.text('Quantity', 250, tableTop);
      doc.text('Price', 350, tableTop);
      doc.text('Total', 450, tableTop);

      // Draw line under header
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Items
      let yPosition = tableTop + 30;
      order.items.forEach(item => {
        doc.text(item.title, 50, yPosition);
        doc.text(item.quantity.toString(), 250, yPosition);
        doc.text(`$${item.price.toFixed(2)}`, 350, yPosition);
        doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 450, yPosition);
        yPosition += 20;
      });

      // Totals
      yPosition += 20;
      doc.text(`Subtotal: $${order.pricing.subtotal.toFixed(2)}`, 350, yPosition);
      yPosition += 15;
      doc.text(`Tax: $${order.pricing.tax.toFixed(2)}`, 350, yPosition);
      yPosition += 15;
      doc.text(`Shipping: $${order.pricing.shipping.toFixed(2)}`, 350, yPosition);
      yPosition += 15;
      doc.fontSize(14).text(`Total: $${order.pricing.total.toFixed(2)}`, 350, yPosition);

      // Footer
      doc.fontSize(10).text('Thank you for your business!', 50, yPosition + 50);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate shipping label PDF
export const generateShippingLabelPDF = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: [400, 600], margin: 20 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      // Shipping label content
      doc.fontSize(16).text('SHIPPING LABEL', 20, 20);
      
      // From address
      doc.fontSize(12).text('FROM:', 20, 60);
      doc.text('E-Shop', 20, 75);
      doc.text('123 Business Street', 20, 90);
      doc.text('City, State 12345', 20, 105);

      // To address
      doc.text('TO:', 20, 140);
      doc.text(`${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`, 20, 155);
      doc.text(order.shippingAddress.address, 20, 170);
      doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`, 20, 185);

      // Order info
      doc.text(`Order: ${order.orderNumber}`, 20, 220);
      doc.text(`Weight: 2.5 lbs`, 20, 235);
      doc.text(`Service: ${order.shippingInfo.method.toUpperCase()}`, 20, 250);

      // Tracking number (if available)
      if (order.shippingInfo.trackingNumber) {
        doc.fontSize(14).text(`Tracking: ${order.shippingInfo.trackingNumber}`, 20, 280);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};