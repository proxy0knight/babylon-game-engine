from flask import Blueprint, request, jsonify
import os
import json
from datetime import datetime

assets_bp = Blueprint('assets', __name__)

# مجلد حفظ الأصول
ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'assets')
MAPS_DIR = os.path.join(ASSETS_DIR, 'maps')
CHARACTERS_DIR = os.path.join(ASSETS_DIR, 'characters')
OBJECTS_DIR = os.path.join(ASSETS_DIR, 'objects')

# إنشاء المجلدات إذا لم تكن موجودة
for directory in [ASSETS_DIR, MAPS_DIR, CHARACTERS_DIR, OBJECTS_DIR]:
    os.makedirs(directory, exist_ok=True)

@assets_bp.route('/save', methods=['POST'])
def save_asset():
    """حفظ أصل (خريطة، شخصية، أو كائن)"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'لا توجد بيانات'}), 400
        
        asset_type = data.get('type')  # map, character, object
        asset_name = data.get('name')
        asset_code = data.get('code')
        
        if not all([asset_type, asset_name, asset_code]):
            return jsonify({'error': 'البيانات المطلوبة مفقودة'}), 400
        
        # تحديد المجلد المناسب
        if asset_type == 'map':
            target_dir = MAPS_DIR
        elif asset_type == 'character':
            target_dir = CHARACTERS_DIR
        elif asset_type == 'object':
            target_dir = OBJECTS_DIR
        else:
            return jsonify({'error': 'نوع الأصل غير صحيح'}), 400
        
        # إنشاء بيانات الأصل
        asset_data = {
            'name': asset_name,
            'type': asset_type,
            'code': asset_code,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # حفظ الملف
        filename = f"{asset_name}.json"
        filepath = os.path.join(target_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(asset_data, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            'success': True,
            'message': f'تم حفظ {asset_type} بنجاح',
            'filename': filename
        })
        
    except Exception as e:
        return jsonify({'error': f'خطأ في الحفظ: {str(e)}'}), 500

@assets_bp.route('/load/<asset_type>/<asset_name>', methods=['GET'])
def load_asset(asset_type, asset_name):
    """تحميل أصل محفوظ"""
    try:
        # تحديد المجلد المناسب
        if asset_type == 'map':
            target_dir = MAPS_DIR
        elif asset_type == 'character':
            target_dir = CHARACTERS_DIR
        elif asset_type == 'object':
            target_dir = OBJECTS_DIR
        else:
            return jsonify({'error': 'نوع الأصل غير صحيح'}), 400
        
        filename = f"{asset_name}.json"
        filepath = os.path.join(target_dir, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'الملف غير موجود'}), 404
        
        with open(filepath, 'r', encoding='utf-8') as f:
            asset_data = json.load(f)
        
        return jsonify({
            'success': True,
            'data': asset_data
        })
        
    except Exception as e:
        return jsonify({'error': f'خطأ في التحميل: {str(e)}'}), 500

@assets_bp.route('/list/<asset_type>', methods=['GET'])
def list_assets(asset_type):
    """قائمة بجميع الأصول من نوع معين"""
    try:
        # تحديد المجلد المناسب
        if asset_type == 'map':
            target_dir = MAPS_DIR
        elif asset_type == 'character':
            target_dir = CHARACTERS_DIR
        elif asset_type == 'object':
            target_dir = OBJECTS_DIR
        else:
            return jsonify({'error': 'نوع الأصل غير صحيح'}), 400
        
        assets = []
        
        for filename in os.listdir(target_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(target_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        asset_data = json.load(f)
                    
                    assets.append({
                        'name': asset_data.get('name'),
                        'filename': filename,
                        'created_at': asset_data.get('created_at'),
                        'updated_at': asset_data.get('updated_at')
                    })
                except:
                    continue
        
        return jsonify({
            'success': True,
            'assets': assets
        })
        
    except Exception as e:
        return jsonify({'error': f'خطأ في جلب القائمة: {str(e)}'}), 500

@assets_bp.route('/delete/<asset_type>/<asset_name>', methods=['DELETE'])
def delete_asset(asset_type, asset_name):
    """حذف أصل محفوظ"""
    try:
        # تحديد المجلد المناسب
        if asset_type == 'map':
            target_dir = MAPS_DIR
        elif asset_type == 'character':
            target_dir = CHARACTERS_DIR
        elif asset_type == 'object':
            target_dir = OBJECTS_DIR
        else:
            return jsonify({'error': 'نوع الأصل غير صحيح'}), 400
        
        filename = f"{asset_name}.json"
        filepath = os.path.join(target_dir, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'الملف غير موجود'}), 404
        
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'message': f'تم حذف {asset_type} بنجاح'
        })
        
    except Exception as e:
        return jsonify({'error': f'خطأ في الحذف: {str(e)}'}), 500

